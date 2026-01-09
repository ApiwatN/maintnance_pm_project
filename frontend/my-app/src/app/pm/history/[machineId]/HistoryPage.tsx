"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import config from "../../../config";
import Swal from "sweetalert2";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Pagination from "../../../components/Pagination";
import { useSocket } from "../../../components/SocketProvider";
import { useAuth } from "../../../../context/AuthContext";


interface ChecklistDetail {
    id: number;
    checklistId: number | null;
    topic?: string;
    isPass: boolean;
    value: string;
    remark: string;
    checklist?: {
        id: number;
        topic: string;
        type: string;
        minVal?: number;
        maxVal?: number;
        options?: string;
    };
    masterChecklist?: {
        id: number;
        topic: string;
        type: string;
        minVal?: number;
        maxVal?: number;
        options?: string;
    };
    image?: string;
    imageBefore?: string;
    imageAfter?: string;
}

interface PMRecord {
    id: number;
    date: string;
    inspector: string;
    checker: string;
    status: string;
    remark: string;
    machine: {
        id: number;
        name: string;
        code: string;
    };
    preventiveType?: { // Now directly on record, not machine
        id: number;
        name: string;
        masterChecklists?: {
            id: number;
            topic: string;
            minVal?: number;
            maxVal?: number;
            options?: string;
        }[];
    };
    details: ChecklistDetail[];
}

interface MachineOption {
    id: number;
    name: string;
    code: string;
    machineMaster?: {
        machineType?: {
            id: number;
            name: string;
            area?: {
                id: number;
                name: string;
            };
        };
    };
}

export default function PMHistoryPage() {
    const { socket } = useSocket();
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialMachineId = params.machineId as string;
    const { loading: authLoading } = useAuth();

    const [records, setRecords] = useState<PMRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedPMType, setSelectedPMType] = useState("");
    const [pmTypes, setPMTypes] = useState<{
        id: number;
        name: string;
        masterChecklists?: {
            id: number;
            topic: string;
            type: string;
            minVal?: number;
            maxVal?: number;
            options?: string;
            order?: number;
        }[];
    }[]>([]);

    // Separate topics for Checklists (OK/NG, Numeric), Images, and More Details (Text, Dropdown)
    const [checklistTopics, setChecklistTopics] = useState<{ name: string, display: string, type: string }[]>([]);
    const [imageTopics, setImageTopics] = useState<{ name: string, display: string, type: string }[]>([]);
    const [moreDetailTopics, setMoreDetailTopics] = useState<{ name: string, display: string, type: string }[]>([]);
    // [NEW] Sub-Item topics (topic : subItemName format)
    const [subItemTopics, setSubItemTopics] = useState<{ name: string, display: string, type: string, parentTopic: string }[]>([]);

    // NEW: Area, Type, Machine Name filters
    const [selectedArea, setSelectedArea] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [selectedMachineId, setSelectedMachineId] = useState(initialMachineId);
    const [selectedMachineName, setSelectedMachineName] = useState("");
    const [isLoaded, setIsLoaded] = useState(false);

    // Dropdown data
    const [areas, setAreas] = useState<any[]>([]);
    const [machineTypes, setMachineTypes] = useState<any[]>([]);
    const [allMachines, setAllMachines] = useState<MachineOption[]>([]);

    // Pagination (server-side)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    // Generate year options (current year ± 5 years)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => (currentYear - 1 + i).toString());

    // Fetch dropdown data on mount
    // Fetch dropdown data on mount
    useEffect(() => {
        if (authLoading) return;
        console.log("Fetching initial data...");
        Promise.all([
            axios.get(`${config.apiServer}/api/areas`),
            axios.get(`${config.apiServer}/api/machine-types`),
            axios.get(`${config.apiServer}/api/machines`),
            axios.get(`${config.apiServer}/api/preventive-types`)
        ]).then(([areasRes, typesRes, machinesRes, pmTypesRes]) => {
            setAreas(areasRes.data);
            setMachineTypes(typesRes.data);
            setAllMachines(machinesRes.data);
            setPMTypes(pmTypesRes.data);

            let targetPMType = "";
            const urlTypeId = searchParams.get('typeId');
            if (urlTypeId) targetPMType = urlTypeId;

            // Set initial machine details from URL param
            if (initialMachineId && initialMachineId !== 'all') {
                const initialMachine = machinesRes.data.find((m: MachineOption) => m.id === parseInt(initialMachineId));
                if (initialMachine) {
                    setSelectedMachineName(initialMachine.name);
                    setSelectedArea(initialMachine.machineMaster?.machineType?.area?.name || "");
                    setSelectedType(initialMachine.machineMaster?.machineType?.name || "");
                    setSelectedMachineId(initialMachineId);
                }
            } else {
                // [NEW] Load from localStorage if no specific machine in URL
                try {
                    const savedFilters = localStorage.getItem('pmHistoryFilters');
                    if (savedFilters) {
                        const filters = JSON.parse(savedFilters);
                        if (filters.year) setSelectedYear(filters.year);
                        if (filters.area) setSelectedArea(filters.area);
                        if (filters.type) setSelectedType(filters.type);
                        if (filters.machineId) {
                            setSelectedMachineId(filters.machineId);
                            const machine = machinesRes.data.find((m: MachineOption) => m.id === parseInt(filters.machineId));
                            if (machine) setSelectedMachineName(machine.name);
                        }
                        if (filters.pmType && !targetPMType) targetPMType = filters.pmType;
                    }
                } catch (e) {
                    console.error("Error loading filters from localStorage", e);
                }
            }

            // Force select first PM Type if none selected (since "All" option is removed)
            if (!targetPMType && pmTypesRes.data.length > 0) {
                targetPMType = pmTypesRes.data[0].id.toString();
            }

            if (targetPMType) setSelectedPMType(targetPMType);

            setIsLoaded(true);
        }).catch(console.error);
    }, [initialMachineId, authLoading]);

    // [NEW] Save filters to localStorage
    useEffect(() => {
        if (isLoaded) {
            const filters = {
                year: selectedYear,
                area: selectedArea,
                type: selectedType,
                machineId: selectedMachineId,
                pmType: selectedPMType
            };
            localStorage.setItem('pmHistoryFilters', JSON.stringify(filters));
        }
    }, [selectedYear, selectedArea, selectedType, selectedMachineId, selectedPMType, isLoaded]);

    // Filter machine types based on selected area
    const filteredMachineTypes = useMemo(() => {
        if (!selectedArea) return machineTypes;
        return machineTypes.filter(t => t.area?.name === selectedArea);
    }, [selectedArea, machineTypes]);

    // Filter machines based on selected area and type
    const filteredMachines = useMemo(() => {
        let machines = allMachines;
        if (selectedArea) {
            machines = machines.filter(m => m.machineMaster?.machineType?.area?.name === selectedArea);
        }
        if (selectedType) {
            machines = machines.filter(m => m.machineMaster?.machineType?.name === selectedType);
        }
        return machines;
    }, [selectedArea, selectedType, allMachines]);



    useEffect(() => {
        if (authLoading) return;
        // Fetch when machine, year, PM type, or page changes
        fetchHistory();
    }, [selectedMachineId, selectedYear, selectedPMType, currentPage, authLoading]);

    // Socket Listener
    useEffect(() => {
        if (!socket) return;
        socket.on('pm_update', () => {
            fetchHistory();
        });
        return () => {
            socket.off('pm_update');
        };
    }, [socket, selectedMachineId, selectedYear]);

    useEffect(() => {
        processRecords();
    }, [records]);

    // Load filters from localStorage
    useEffect(() => {
        const savedFilters = localStorage.getItem("pmHistoryFilters");
        if (savedFilters) {
            try {
                const p = JSON.parse(savedFilters);
                if (p.year) setSelectedYear(p.year);
                // Only restore navigation filters if no specific machine ID overrides them later
                // But since async fetch overrides, we can just set them here.
                if (p.area) setSelectedArea(p.area);
                if (p.type) setSelectedType(p.type);
                // We typically don't restore machineId if URL param 'machineId' exists and is valid
                // But if the URL param is invalid (e.g. 'all'), we might want to?
                // For now, let's restore it, and let the initialMachineId logic override if successful.
                if (p.machineId && p.machineId !== initialMachineId) {
                    // Only set if different, but actually checking !initialMachineId is safer for "Generic" view
                    // But this page requires [machineId] param.
                }
            } catch (e) {
                console.error("Failed to load filters", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save filters to localStorage including selectedMachineId
    // Save filters to localStorage including selectedMachineId
    useEffect(() => {
        if (!isLoaded) return;
        const filters = {
            year: selectedYear,
            area: selectedArea,
            type: selectedType,
            machineId: selectedMachineId
        };
        localStorage.setItem("pmHistoryFilters", JSON.stringify(filters));
    }, [selectedYear, selectedArea, selectedType, selectedMachineId, isLoaded]);

    const fetchHistory = () => {
        setLoading(true);

        const targetId = selectedMachineId || 'all';

        // Build query params including pagination
        console.log("Fetching history with PM Type:", selectedPMType);
        const params = new URLSearchParams({
            year: selectedYear,
            page: currentPage.toString(),
            limit: itemsPerPage.toString()
        });
        if (selectedPMType) {
            params.append('pmTypeId', selectedPMType);
        }
        // [NEW] Send Area and Type for filtering "All Machines"
        if (selectedArea) {
            params.append('area', selectedArea);
        }
        if (selectedType) {
            params.append('type', selectedType);
        }

        // Fetch both: history records AND machine details (only if specific machine)
        const requests = [
            axios.get(`${config.apiServer}/api/pm/machine/${targetId}/history?${params.toString()}`)
        ];

        if (selectedMachineId && selectedMachineId !== 'all') {
            requests.push(axios.get(`${config.apiServer}/api/machines/${selectedMachineId}`));
        } else {
            // Mock response for generic view with correct type
            requests.push(Promise.resolve({
                data: null,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {}
            } as any));
        }

        Promise.all(requests)
            .then(([historyRes, machineRes]) => {
                // Handle paginated response from server
                const response = historyRes.data;
                const paginatedRecords = response.data || response; // Support both new and old format
                const pagination = response.pagination;
                const machine = machineRes.data;

                setRecords(paginatedRecords);
                if (pagination) {
                    setTotalItems(pagination.total);
                } else {
                    // Fallback for old format (array directly)
                    setTotalItems(Array.isArray(response) ? response.length : 0);
                }

                if (machine) {
                    setSelectedMachineName(machine.name);
                } else if (!selectedMachineId) {
                    setSelectedMachineName("All Machines");
                }

                // [REMOVED] Logic that overwrites pmTypes based on current page records
                // We now fetch all PM Types on mount to allow full filtering capability

                // Prioritize typeId from URL, otherwise use first type (only on first load)
                // Prioritize typeId from URL
                const urlTypeId = searchParams.get('typeId');
                if (urlTypeId && !selectedPMType) {
                    setSelectedPMType(urlTypeId);
                }

                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    };

    const resolveMinMax = (checklist: any, currentDetails: any[]) => {
        let min = checklist.minVal;
        let max = checklist.maxVal;

        if (checklist.type === 'NUMERIC' && checklist.options) {
            try {
                const parsed = JSON.parse(checklist.options);
                if (parsed.parentId && parsed.conditions) {
                    const parentDetail = currentDetails.find(d => d.checklistId === parsed.parentId);
                    if (parentDetail && parentDetail.value) {
                        const condition = parsed.conditions[parentDetail.value];
                        if (condition) {
                            if (condition.min !== undefined && condition.min !== "") min = parseFloat(condition.min);
                            if (condition.max !== undefined && condition.max !== "") max = parseFloat(condition.max);
                        }
                    }
                }
            } catch (e) {
                // Ignore parse error
            }
        }
        return { min, max };
    };

    // Process records to extract column headers (no filtering - server already filtered)
    const processRecords = () => {
        // [FIX] Use the selected PM Type configuration to define columns
        // This ensures we ONLY show columns relevant to the selected type, ignoring "ghost" data in records
        const currentPMTypeConfig = pmTypes.find(t => t.id.toString() === selectedPMType);
        const validMasterChecklists = currentPMTypeConfig?.masterChecklists || [];

        // [NEW] First, identify all topics that have subItems (to exclude from main columns)
        const topicsWithSubItems = new Set<string>();
        validMasterChecklists.forEach((mc: any) => {
            if (mc.options) {
                try {
                    const opts = JSON.parse(mc.options);
                    if (opts.subItems && Array.isArray(opts.subItems) && opts.subItems.length > 0) {
                        topicsWithSubItems.add(mc.topic);
                    }
                } catch { /* ignore parse errors */ }
            }
        });

        // Separate topics into Checklists (BOOLEAN, NUMERIC), Images (IMAGE), and More Details (TEXT, DROPDOWN)
        const checklistMap = new Map<string, { name: string, display: string, type: string, order: number, masterChecklist?: any }>();
        const imageMap = new Map<string, { name: string, display: string, type: string, order: number }>();
        const detailsMap = new Map<string, { name: string, display: string, type: string, order: number }>();

        // [FIX] Iterate over the MASTER CONFIGURATION, not the records
        validMasterChecklists.forEach((mc: any) => {
            const topicName = mc.topic;
            const type = mc.type;
            const order = mc.order ?? 9999;

            // Skip topics that have subItems (they will be shown as sub-item columns instead)
            if (topicsWithSubItems.has(topicName)) {
                return;
            }

            let displayName = topicName;

            // For Numeric, check if it's dynamic
            let isDynamic = false;
            if (type === 'NUMERIC' && mc.options) {
                try {
                    const parsed = JSON.parse(mc.options);
                    if (parsed.parentId && parsed.conditions) isDynamic = true;
                } catch { }
            }

            if (type === 'NUMERIC' && !isDynamic && mc.minVal !== undefined && mc.maxVal !== undefined) {
                displayName = `${topicName} (${mc.minVal}-${mc.maxVal})`;
            } else if (type === 'NUMERIC' && isDynamic) {
                displayName = `${topicName} (Dynamic)`;
            }

            if (type === 'BOOLEAN' || type === 'NUMERIC') {
                checklistMap.set(topicName, { name: topicName, display: displayName, type, order, masterChecklist: mc });
            } else if (type === 'IMAGE') {
                imageMap.set(topicName, { name: topicName, display: topicName, type, order });
            } else if (type === 'TEXT' || type === 'DROPDOWN') {
                detailsMap.set(topicName, { name: topicName, display: topicName, type, order });
            }
        });

        // [FIX] Collect Sub-Item topics from MasterChecklist.options.subItems
        const checklistSubItemsMap = new Map<string, { name: string, display: string, type: string, parentTopic: string, order: number }>();
        const detailSubItemsMap = new Map<string, { name: string, display: string, type: string, parentTopic: string, order: number }>();

        validMasterChecklists.forEach((mc: any) => {
            if (mc.options) {
                try {
                    const opts = JSON.parse(mc.options);
                    if (opts.subItems && Array.isArray(opts.subItems)) {
                        opts.subItems.forEach((subItem: string) => {
                            const displayName = `${mc.topic} : ${subItem}`;
                            const key = displayName;
                            const entry = {
                                name: key,
                                display: displayName,
                                type: mc.type,
                                parentTopic: mc.topic,
                                order: mc.order ?? 9999
                            };

                            if (mc.type === 'TEXT' || mc.type === 'DROPDOWN') {
                                detailSubItemsMap.set(key, entry);
                            } else {
                                checklistSubItemsMap.set(key, entry);
                            }
                        });
                    }
                } catch { /* ignore parse errors */ }
            }
        });

        // Sort by order before setting state
        setChecklistTopics(Array.from(checklistMap.values()).sort((a, b) => a.order - b.order));
        setImageTopics(Array.from(imageMap.values()).sort((a, b) => a.order - b.order));
        setMoreDetailTopics(Array.from(detailsMap.values()).sort((a, b) => a.order - b.order));

        setSubItemTopics([
            ...Array.from(detailSubItemsMap.values()).sort((a, b) => a.order - b.order),
            ...Array.from(checklistSubItemsMap.values()).sort((a, b) => a.order - b.order)
        ]);
    };

    const getValue = (record: PMRecord, topic: string, isActualSubItem: boolean = false) => {
        // isActualSubItem indicates if this topic comes from subItemTopics array (true sub-items with subItemName in DB)

        const detail = record.details.find((d: any) => {
            const resolvedTopic = d.masterChecklist?.topic || d.topic;

            if (isActualSubItem) {
                // For actual Sub-Item (from subItemTopics): match "baseTopic : subItemName" format
                const [baseTopic, subItemName] = topic.split(' : ');
                const detailBaseTopic = resolvedTopic?.split(' : ')[0] || resolvedTopic;

                // Must have subItemName in detail for it to be a sub-item match
                return d.subItemName &&
                    (detailBaseTopic === baseTopic || resolvedTopic === baseTopic) &&
                    d.subItemName === subItemName;
            }

            // For regular topics (including those with " : " in name like "Check Gap Argon Cover Fixture : 1")
            // Match by exact topic name and ensure it's NOT a sub-item detail
            return resolvedTopic === topic && !d.subItemName;
        });

        if (!detail) return '-';

        if (detail.value) {
            // For Dropdown, include Spec in export if available
            const type = detail.masterChecklist?.type || detail.checklist?.type;
            if (type === 'DROPDOWN' && detail.masterChecklist?.options) {
                try {
                    const opts = JSON.parse(detail.masterChecklist.options);
                    if (Array.isArray(opts)) {
                        const selected = opts.find((o: any) => (o.label || o) === detail.value);
                        if (selected && selected.spec) {
                            return `${detail.value} (Spec: ${selected.spec})`;
                        }
                    }
                } catch { }
            }
            return detail.value;
        } else {
            return detail.isPass ? 'OK' : 'NG';
        }
    };

    const getDisplayValue = (record: PMRecord, topic: string, isActualSubItem: boolean = false) => {
        // isActualSubItem indicates if this topic comes from subItemTopics array

        const detail = record.details.find((d: any) => {
            const resolvedTopic = d.masterChecklist?.topic || d.topic;

            if (isActualSubItem) {
                // For actual Sub-Item: match "baseTopic : subItemName" format
                const [baseTopic, subItemName] = topic.split(' : ');
                const detailBaseTopic = resolvedTopic?.split(' : ')[0] || resolvedTopic;
                return d.subItemName &&
                    (detailBaseTopic === baseTopic || resolvedTopic === baseTopic) &&
                    d.subItemName === subItemName;
            }
            // For regular topics: match exact topic and ensure NOT a sub-item detail
            return resolvedTopic === topic && !d.subItemName;
        });

        if (!detail) return '-';

        const type = detail.masterChecklist?.type || detail.checklist?.type;

        if (type === 'DROPDOWN') {
            let spec = "";
            if (detail.masterChecklist?.options) {
                try {
                    const opts = JSON.parse(detail.masterChecklist.options);
                    if (Array.isArray(opts)) {
                        const selected = opts.find((o: any) => (o.label || o) === detail.value);
                        if (selected && selected.spec) spec = selected.spec;
                    }
                } catch { }
            }
            return (
                <div>
                    <div>{detail.value || '-'}</div>
                    {spec && <div className="badge bg-secondary bg-opacity-25 text-dark fw-normal" style={{ fontSize: '0.7rem' }}>{spec}</div>}
                </div>
            );
        } else if (type === 'NUMERIC') {
            // Calculate resolved Min/Max
            const master = detail.masterChecklist || detail.checklist;
            let rangeInfo = "";
            if (master) {
                const { min, max } = resolveMinMax(master, record.details);
                if (min !== undefined && max !== undefined) {
                    rangeInfo = `${min} - ${max}`;
                }
            }

            return (
                <div className="position-relative group">
                    <div>{detail.value || '-'}</div>
                    {rangeInfo && (
                        <div className="text-muted fst-italic" style={{ fontSize: '0.65rem' }}>
                            ({rangeInfo})
                        </div>
                    )}
                </div>
            );
        } else if (type === 'IMAGE') {
            // Parse Images
            const parseImages = (jsonStr?: string) => {
                try {
                    if (!jsonStr) return [];
                    if (jsonStr.startsWith('[')) return JSON.parse(jsonStr);
                    return [{ label: 'Default', url: jsonStr }];
                } catch { return []; }
            };

            const beforeImages = parseImages(detail.imageBefore);
            const afterImages = parseImages(detail.imageAfter);

            if (beforeImages.length === 0 && afterImages.length === 0) return '-';

            return (
                <div className="d-flex gap-3 justify-content-center">
                    {beforeImages.length > 0 && (
                        <div className="d-flex gap-1 align-items-center border-end pe-2">
                            <span className="badge bg-secondary" style={{ fontSize: '0.6rem' }}>B</span>
                            <div className="d-flex gap-1 flex-wrap" style={{ maxWidth: '150px' }}>
                                {beforeImages.map((img: any, idx: number) => (
                                    <a key={idx} href={img.url} target="_blank" rel="noreferrer" title={img.label}>
                                        <img src={img.url} alt={img.label} className="rounded border" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                    {afterImages.length > 0 && (
                        <div className="d-flex gap-1 align-items-center">
                            <span className="badge bg-success" style={{ fontSize: '0.6rem' }}>A</span>
                            <div className="d-flex gap-1 flex-wrap" style={{ maxWidth: '150px' }}>
                                {afterImages.map((img: any, idx: number) => (
                                    <a key={idx} href={img.url} target="_blank" rel="noreferrer" title={img.label}>
                                        <img src={img.url} alt={img.label} className="rounded border" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (detail.value) {
            return detail.value;
        } else {
            return detail.isPass ? 'OK' : 'NG';
        }
    };

    const getStatusColor = (record: PMRecord, topic: string, isActualSubItem: boolean = false) => {
        // isActualSubItem indicates if this topic comes from subItemTopics array

        const detail = record.details.find((d: any) => {
            const resolvedTopic = d.masterChecklist?.topic || d.topic;

            if (isActualSubItem) {
                // For actual Sub-Item: match "baseTopic : subItemName" format
                const [baseTopic, subItemName] = topic.split(' : ');
                const detailBaseTopic = resolvedTopic?.split(' : ')[0] || resolvedTopic;
                return d.subItemName &&
                    (detailBaseTopic === baseTopic || resolvedTopic === baseTopic) &&
                    d.subItemName === subItemName;
            }
            // For regular topics: match exact topic and ensure NOT a sub-item detail
            return resolvedTopic === topic && !d.subItemName;
        });

        if (!detail) return '';

        if (!detail.value) {
            return detail.isPass ? 'text-success fw-bold' : 'text-danger fw-bold';
        }
        // For Numeric, we can also colorize based on pass/fail if we trust isPass
        if ((detail.masterChecklist?.type === 'NUMERIC' || detail.checklist?.type === 'NUMERIC') && !detail.isPass) {
            return 'text-danger fw-bold';
        }

        return '';
    };

    const getRecordStatus = (record: PMRecord) => {
        // If status is already 'COMPLETED' or 'CHECKED', we might want to override based on content?
        // User request: "Completed when all pass, if not pass show CHECKED (NG)"
        // We check if ANY detail is NG.
        const hasNG = record.details.some(d => !d.isPass);
        if (hasNG) return 'CHECKED (NG)';
        return 'COMPLETED'; // Or 'CHECKED (ALL OK)'? User said "completed เมื่อทุกอัน ผ่านหมด".
    };

    const handleDelete = (recordId: number) => {
        Swal.fire({
            title: "ยืนยันการลบ",
            text: "คุณต้องการลบประวัติการ PM นี้หรือไม่?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "ใช่, ลบเลย!",
            cancelButtonText: "ยกเลิก",
        }).then((result) => {
            if (result.isConfirmed) {
                axios
                    .delete(`${config.apiServer}/api/pm/records/${recordId}`)
                    .then(() => {
                        Swal.fire({
                            title: "ลบสำเร็จ!",
                            text: "ลบประวัติการ PM เรียบร้อยแล้ว",
                            icon: "success",
                            timer: 300,
                            showConfirmButton: false
                        });
                        fetchHistory();
                    })
                    .catch((err) => {
                        console.error(err);
                        Swal.fire("ผิดพลาด!", "ไม่สามารถลบประวัติได้", "error");
                    });
            }
        });
    };

    // Combine all topics for export (including Sub-Items)
    const allTopics = [...imageTopics, ...checklistTopics, ...moreDetailTopics, ...subItemTopics];

    const fetchAllHistory = async () => {
        const targetId = selectedMachineId || 'all';
        const params = new URLSearchParams({
            year: selectedYear,
            page: '1',
            limit: '100000' // Fetch all (large limit)
        });
        if (selectedPMType) {
            params.append('pmTypeId', selectedPMType);
        }

        try {
            const response = await axios.get(`${config.apiServer}/api/pm/machine/${targetId}/history?${params.toString()}`);
            let data = response.data.data || response.data; // Support both formats

            // [FIX] Client-side filter for Area and Type using allMachines lookup
            if (selectedArea) {
                data = data.filter((r: PMRecord) => {
                    const machine = allMachines.find(m => m.id === r.machine.id);
                    return machine?.machineMaster?.machineType?.area?.name === selectedArea;
                });
            }
            if (selectedType) {
                data = data.filter((r: PMRecord) => {
                    const machine = allMachines.find(m => m.id === r.machine.id);
                    return machine?.machineMaster?.machineType?.name === selectedType;
                });
            }

            return data;
        } catch (error) {
            console.error("Error fetching all history:", error);
            Swal.fire("Error", "Failed to fetch all data for export", "error");
            return [];
        }
    };

    const handleExportExcel = async (type: 'page' | 'all') => {
        if (type === 'page') {
            exportToExcel(records);
        } else {
            // Show loading
            Swal.fire({
                title: 'Preparing Export...',
                text: 'Fetching all records, please wait.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            const allRecords = await fetchAllHistory();
            Swal.close();
            if (allRecords.length > 0) {
                exportToExcel(allRecords);
            } else {
                Swal.fire("Info", "No records found to export", "info");
            }
        }
    };

    const handleExportPDF = async (type: 'page' | 'all') => {
        if (type === 'page') {
            exportToPDF(records);
        } else {
            // Show loading
            Swal.fire({
                title: 'Preparing Export...',
                text: 'Fetching all records, please wait.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            const allRecords = await fetchAllHistory();
            Swal.close();
            if (allRecords.length > 0) {
                exportToPDF(allRecords);
            } else {
                Swal.fire("Info", "No records found to export", "info");
            }
        }
    };

    const exportToExcel = (recordsToExport: PMRecord[]) => {
        const pmTypeName = pmTypes.find(t => t.id === parseInt(selectedPMType))?.name || 'All';
        const areaLabel = selectedArea || 'AllAreas';
        const typeLabel = selectedType || 'AllTypes';
        const machineLabel = selectedMachineName || 'AllMachines';

        const data = recordsToExport.map((record, index) => {
            const row: any = {
                'No': index + 1,
                'Date': new Date(record.date).toLocaleDateString('th-TH'),
                'Time': new Date(record.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                'Machine': record.machine.name,
                'Code': record.machine.code,
                'Inspector': record.inspector,
                'Checker': record.checker,
                'Status': getRecordStatus(record), // Use calculated status
            };

            // Add topic columns
            allTopics.forEach(topic => {
                row[topic.display] = getValue(record, topic.name);
            });

            row['Remark'] = record.remark || '-';

            return row;
        });

        const ws = XLSX.utils.json_to_sheet(data);

        // [FIX] Set column widths
        const columnWidths: { wch: number }[] = [
            { wch: 5 },   // No
            { wch: 12 },  // Date
            { wch: 8 },   // Time
            { wch: 15 },  // Machine
            { wch: 10 },  // Code
            { wch: 15 },  // Inspector
            { wch: 15 },  // Checker
            { wch: 15 },  // Status
        ];

        // Add widths for topic columns
        allTopics.forEach(topic => {
            // Wider for sub-items (contain " : "), narrower for simple OK/NG
            const width = topic.display.includes(' : ') ? 18 : 12;
            columnWidths.push({ wch: width });
        });

        // Remark column
        columnWidths.push({ wch: 20 });

        ws['!cols'] = columnWidths;

        // [FIX] Apply center alignment and header styling
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        for (let R = range.s.r; R <= range.e.r; R++) {
            for (let C = range.s.c; C <= range.e.c; C++) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellAddress]) continue;

                // Create cell style object
                if (!ws[cellAddress].s) ws[cellAddress].s = {};

                // Center align all cells
                ws[cellAddress].s.alignment = { horizontal: 'center', vertical: 'center' };

                // Header row styling (first row)
                if (R === 0) {
                    ws[cellAddress].s.font = { bold: true };
                    ws[cellAddress].s.fill = { fgColor: { rgb: '0D6EFD' }, patternType: 'solid' };
                    ws[cellAddress].s.font = { bold: true, color: { rgb: 'FFFFFF' } };
                }
            }
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'PM History');
        XLSX.writeFile(wb, `PM_History_${areaLabel}_${typeLabel}_${machineLabel}_${pmTypeName}_${selectedYear}.xlsx`);
    };

    const exportToPDF = (recordsToExport: PMRecord[]) => {
        const pmTypeName = pmTypes.find(t => t.id === parseInt(selectedPMType))?.name || 'All';
        const areaLabel = selectedArea || 'All Areas';
        const typeLabel = selectedType || 'All Types';
        const machineLabel = selectedMachineName || 'All Machines';
        const doc = new jsPDF('l', 'mm', 'a4');

        doc.setFontSize(14);
        doc.text(`PM History - ${machineLabel} (${pmTypeName})`, 14, 10);
        doc.setFontSize(9);
        doc.text(`Area: ${areaLabel} | Type: ${typeLabel} | Year: ${selectedYear}`, 14, 16);

        // Define fixed columns (No, Date, Time, Machine, Inspector, Checker, Status)
        const fixedHeaders = ['No', 'Date', 'Time', 'Machine', 'Inspector', 'Checker', 'Status'];
        const topicHeaders = allTopics.map(t => t.display);
        const headers = [...fixedHeaders, ...topicHeaders, 'Remark'];

        // Number of fixed columns (headers that should stay horizontal)
        const fixedColCount = fixedHeaders.length;
        const remarkColIndex = headers.length - 1;

        const data = recordsToExport.map((record, index) => [
            index + 1,
            new Date(record.date).toLocaleDateString('th-TH'),
            new Date(record.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            record.machine.name,
            record.inspector,
            record.checker,
            getRecordStatus(record),
            ...allTopics.map(topic => {
                const isActualSubItem = subItemTopics.some(st => st.name === topic.name);
                return getValue(record, topic.name, isActualSubItem);
            }),
            record.remark || '-'
        ]);

        // Calculate appropriate font size based on number of columns
        const totalColumns = headers.length;
        let fontSize = 6;
        if (totalColumns <= 15) fontSize = 7;
        if (totalColumns <= 12) fontSize = 8;
        if (totalColumns > 20) fontSize = 5;
        if (totalColumns > 25) fontSize = 4;

        // Height for vertical headers
        const verticalHeaderHeight = 35;

        autoTable(doc, {
            head: [headers.map((h, i) => (i >= fixedColCount && i < remarkColIndex) ? '' : h)], // Empty for vertical headers
            body: data,
            startY: 20,
            theme: 'grid',
            styles: {
                fontSize: fontSize,
                cellPadding: 1,
                valign: 'middle',
                halign: 'center',
                overflow: 'linebreak',
                lineWidth: 0.1
            },
            headStyles: {
                fillColor: [13, 110, 253],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center',
                valign: 'bottom',
                fontSize: fontSize,
                cellPadding: 1,
                minCellHeight: verticalHeaderHeight
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250]
            },
            margin: { left: 5, right: 5, top: 20 },
            tableWidth: 'wrap',
            showHead: 'everyPage',
            didDrawCell: function (data) {
                // Draw vertical text for topic headers (columns 7 to n-1)
                if (data.section === 'head' && data.column.index >= fixedColCount && data.column.index < remarkColIndex) {
                    const headerText = headers[data.column.index];
                    const cell = data.cell;

                    // Save graphics state
                    doc.saveGraphicsState();

                    // Set text properties
                    doc.setFontSize(fontSize);
                    doc.setTextColor(255, 255, 255);

                    // Calculate position for rotated text
                    const x = cell.x + cell.width / 2 + 1;
                    const y = cell.y + cell.height - 2;

                    // Rotate and draw text
                    doc.text(headerText, x, y, {
                        angle: 90,
                        align: 'left'
                    });

                    // Restore graphics state
                    doc.restoreGraphicsState();
                }
            },
            didParseCell: function (data) {
                // Make Remark column left-aligned
                if (data.column.index === remarkColIndex) {
                    data.cell.styles.halign = 'left';
                }
                // Narrower width for topic columns
                if (data.column.index >= fixedColCount && data.column.index < remarkColIndex) {
                    data.cell.styles.cellWidth = 8;
                }
            }
        });

        doc.save(`PM_History_${areaLabel}_${typeLabel}_${machineLabel}_${pmTypeName}_${selectedYear}.pdf`);
    };

    // Pagination
    // Server-side pagination: records already contains only the items for the current page
    const currentItems = records;

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <div className="container-fluid py-4 px-4 bg-light min-vh-100">
            <style jsx>{`
                /* Custom Scrollbar */
                .table-responsive::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .table-responsive::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                }
                .table-responsive::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 4px;
                }
                .table-responsive::-webkit-scrollbar-thumb:hover {
                    background: #a8a8a8;
                }

                .sticky-header {
                    /* Removed position: sticky to rely on thead's sticky behavior for vertical scrolling */
                    background-color: var(--bs-light);
                    box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.1);
                }
                .sticky-col-right {
                    position: sticky !important;
                    background-color: #fff;
                    z-index: 1010;
                    border-left: 1px solid #dee2e6;
                    box-shadow: -2px 0 2px -1px rgba(0, 0, 0, 0.1); /* Add shadow */
                }
                .table-hover tbody tr:hover .sticky-col-right {
                    background-color: var(--bs-table-hover-bg) !important;
                }
                .sticky-header-right {
                    position: sticky !important;
                    top: 0px !important; /* Match thead top */
                    right: 0;
                    z-index: 1010; /* Higher than thead (1000) */
                    background-color: var(--bs-light);
                    border-left: 1px solid #dee2e6;
                }
            `}</style>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">PM History</h2>
                    <p className="text-muted mb-0">
                        ประวัติการตรวจสอบ PM - {selectedMachineName || "Loading..."}
                    </p>
                </div>
                <div className="d-flex gap-2">
                    {/* Export Excel Split Button */}
                    <div className="btn-group shadow-sm">
                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={() => handleExportExcel('page')}
                            disabled={records.length === 0}
                        >
                            <i className="bi bi-file-earmark-excel me-2"></i>Export Excel
                        </button>
                        <button
                            type="button"
                            className="btn btn-success dropdown-toggle dropdown-toggle-split"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            disabled={records.length === 0}
                        >
                            <span className="visually-hidden">Toggle Dropdown</span>
                        </button>
                        <ul className="dropdown-menu">
                            <li>
                                <button className="dropdown-item" onClick={() => handleExportExcel('page')}>
                                    Export Current Page
                                </button>
                            </li>
                            <li>
                                <button className="dropdown-item" onClick={() => handleExportExcel('all')}>
                                    Export All Records
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Export PDF Split Button */}
                    <div className="btn-group shadow-sm">
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => handleExportPDF('page')}
                            disabled={records.length === 0}
                        >
                            <i className="bi bi-file-earmark-pdf me-2"></i>Export PDF
                        </button>
                        <button
                            type="button"
                            className="btn btn-danger dropdown-toggle dropdown-toggle-split"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            disabled={records.length === 0}
                        >
                            <span className="visually-hidden">Toggle Dropdown</span>
                        </button>
                        <ul className="dropdown-menu">
                            <li>
                                <button className="dropdown-item" onClick={() => handleExportPDF('page')}>
                                    Export Current Page
                                </button>
                            </li>
                            <li>
                                <button className="dropdown-item" onClick={() => handleExportPDF('all')}>
                                    Export All Records
                                </button>
                            </li>
                        </ul>
                    </div>
                    <Link href={searchParams.get('returnTo') || "/"} className="btn btn-light shadow-sm border ms-3">
                        <i className="bi bi-arrow-left me-2"></i>
                        {searchParams.get('returnTo')?.includes('calendar') ? 'Back to Calendar' :
                            searchParams.get('returnTo')?.includes('machines/overall') ? 'Back to Overall Status' :
                                'Back to Dashboard'}
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="card border-0 shadow-sm rounded-3 mb-4">
                <div className="card-body p-4">
                    <div className="row g-2 align-items-end">
                        <div className="col-md-2">
                            <label className="form-label fw-bold text-muted small">Area</label>
                            <select
                                className="form-select bg-light border-0"
                                value={selectedArea}
                                onChange={(e) => {
                                    setSelectedArea(e.target.value);
                                    setSelectedType("");
                                    setSelectedMachineId("");
                                    setSelectedMachineName("");
                                }}
                            >
                                <option value="">All Areas</option>
                                {areas.map((a) => (
                                    <option key={a.id} value={a.name}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label fw-bold text-muted small">Machine Type</label>
                            <select
                                className="form-select bg-light border-0"
                                value={selectedType}
                                onChange={(e) => {
                                    setSelectedType(e.target.value);
                                    setSelectedMachineId("");
                                    setSelectedMachineName("");
                                }}
                            >
                                <option value="">All Types</option>
                                {filteredMachineTypes.map((t) => (
                                    <option key={t.id} value={t.name}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label fw-bold text-muted small">Machine Name</label>
                            <select
                                className="form-select bg-light border-0"
                                value={selectedMachineId}
                                onChange={(e) => {
                                    const newMachineId = e.target.value;
                                    const machine = filteredMachines.find(m => m.id === parseInt(newMachineId));
                                    setSelectedMachineId(newMachineId);
                                    setSelectedMachineName(machine?.name || "");

                                    // Update URL to persist selection on refresh
                                    const returnTo = searchParams.get('returnTo') || '/';
                                    if (newMachineId) {
                                        router.push(`/pm/history/${newMachineId}?returnTo=${returnTo}`);
                                    } else {
                                        router.push(`/pm/history/all?returnTo=${returnTo}`);
                                    }
                                }}
                            >
                                <option value="">All Machine Name</option>
                                {Array.from(new Map(filteredMachines.map(m => [m.name, m])).values()).map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} ({m.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label fw-bold text-muted small">Year</label>
                            <select
                                className="form-select bg-light border-0"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                <option value="">All Years</option>
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label fw-bold text-muted small">PM Type</label>
                            <select
                                className="form-select bg-light border-0"
                                value={selectedPMType}
                                onChange={(e) => setSelectedPMType(e.target.value)}
                                disabled={pmTypes.length === 0}
                            >
                                {/* <option value="">All PM Types</option> */}
                                {pmTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <div className="d-grid">
                                <span className="badge bg-primary bg-opacity-10 text-primary fs-6 py-2">
                                    <i className="bi bi-list-check me-2"></i>
                                    {totalItems} Found
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PM History Table */}
            <div className="card border-0 shadow-sm rounded-3">
                <div className="card-header bg-primary text-white py-3">
                    <h5 className="mb-0 fw-bold">
                        <i className="bi bi-clock-history me-2"></i>PM History Records
                    </h5>
                </div>
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : records.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
                            No PM records found for the selected filters
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive" style={{ overflowX: 'auto' }}>
                                <table className="table table-hover table-bordered border-secondary align-middle mb-0">
                                    <thead className="bg-light text-secondary" style={{ position: 'sticky', top: '0px', zIndex: 1000 }}>
                                        <tr>
                                            <th className="ps-4 py-3 text-center align-middle border fw-bold sticky-header" style={{ minWidth: '60px' }} rowSpan={2}>No</th>
                                            <th className="py-3 text-center align-middle border fw-bold sticky-header" style={{ minWidth: '100px' }} rowSpan={2}>Date</th>
                                            <th className="py-3 text-center align-middle border fw-bold sticky-header" style={{ minWidth: '80px' }} rowSpan={2}>Time</th>
                                            <th className="py-3 text-center align-middle border fw-bold sticky-header" style={{ minWidth: '150px' }} rowSpan={2}>Machine</th>
                                            <th className="py-3 text-center align-middle border fw-bold sticky-header" style={{ minWidth: '120px' }} rowSpan={2}>Inspector</th>
                                            <th className="py-3 text-center align-middle border fw-bold sticky-header" style={{ minWidth: '120px' }} rowSpan={2}>Checker</th>
                                            <th className="py-3 text-center align-middle border fw-bold sticky-header" style={{ minWidth: '100px' }} rowSpan={2}>Status</th>

                                            {/* More Details Section Header (Text, Dropdown) - Now Horizontal & First */}
                                            {moreDetailTopics.map((topic, idx) => (
                                                <th key={`md-${idx}`} className="py-3 text-center align-middle bg-primary bg-opacity-25 text-primary border fw-bold" style={{ minWidth: '120px' }} rowSpan={2}>
                                                    {topic.display}
                                                </th>
                                            ))}

                                            {/* Image Evidence Section Header */}
                                            {imageTopics.length > 0 && (
                                                <th colSpan={imageTopics.length} className="py-3 text-center bg-info bg-opacity-25 text-dark border fw-bold">
                                                    <i className="bi bi-card-image me-2"></i>Image Evidence
                                                </th>
                                            )}

                                            {/* Checklists Section Header (OK/NG, Numeric) */}
                                            {checklistTopics.length > 0 && (
                                                <th colSpan={checklistTopics.length} className="py-3 text-center bg-success bg-opacity-25 text-success border fw-bold">
                                                    <i className="bi bi-check2-square me-2"></i>Checklists
                                                </th>
                                            )}

                                            {/* [NEW] Sub-Items Section Header */}
                                            {subItemTopics.length > 0 && (
                                                <th colSpan={subItemTopics.length} className="py-3 text-center bg-warning bg-opacity-25 text-warning border fw-bold">
                                                    <i className="bi bi-layers me-2"></i>Sub-Items (Detailed)
                                                </th>
                                            )}

                                            <th className="py-3 text-center align-middle border fw-bold sticky-header" style={{ minWidth: '150px' }} rowSpan={2}>Remark</th>
                                            {/* Right Sticky Column: Actions */}
                                            <th className="py-3 text-center align-middle pe-4 border fw-bold sticky-header-right" style={{ minWidth: '280px', right: 0 }} rowSpan={2}>Actions</th>
                                        </tr>
                                        <tr>
                                            {/* Image Topic Columns */}
                                            {imageTopics.map((topic, idx) => (
                                                <th key={`img-${idx}`} className="py-2 text-center bg-info bg-opacity-10 border small fw-bold text-dark align-bottom" style={{ minWidth: '120px', height: '180px' }}>
                                                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: 'auto', width: '100%' }}>
                                                        {topic.display}
                                                    </div>
                                                </th>
                                            ))}

                                            {/* Checklist Topic Columns */}
                                            {checklistTopics.map((topic, idx) => (
                                                <th key={`cl-${idx}`} className="py-2 text-center bg-success bg-opacity-10 border small fw-bold text-dark align-bottom" style={{ minWidth: '40px', height: '180px' }}>
                                                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: 'auto', width: '100%' }}>
                                                        {topic.display}
                                                    </div>
                                                </th>
                                            ))}

                                            {/* [NEW] Sub-Item Topic Columns */}
                                            {subItemTopics.map((topic, idx) => (
                                                <th key={`sub-${idx}`} className="py-2 text-center bg-warning bg-opacity-10 border small fw-bold text-dark align-bottom" style={{ minWidth: '60px', height: '180px' }}>
                                                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: 'auto', width: '100%' }}>
                                                        {topic.display}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((record, index) => {
                                            const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
                                            return (
                                                <tr key={record.id}>
                                                    <td className="ps-4 text-center fw-bold text-muted border-end">{indexOfFirstItem + index + 1}</td>
                                                    <td className="border-end text-center">
                                                        <div className="fw-bold text-dark">
                                                            {new Date(record.date).toLocaleDateString("th-TH")}
                                                        </div>
                                                    </td>
                                                    <td className="border-end text-center">
                                                        <div className="text-muted font-monospace">
                                                            {new Date(record.date).toLocaleTimeString("th-TH", {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="border-end">
                                                        <div className="fw-bold text-dark">{record.machine.name}</div>
                                                        <small className="text-muted font-monospace">
                                                            {record.machine.code}
                                                        </small>
                                                    </td>
                                                    <td className="border-end">{record.inspector}</td>
                                                    <td className="border-end">{record.checker}</td>
                                                    <td className="text-center border-end">
                                                        <span
                                                            className={`badge rounded-pill px-3 py-2 fw-normal ${getRecordStatus(record) === "COMPLETED"
                                                                ? "bg-success text-white"
                                                                : "bg-danger text-white"
                                                                }`}
                                                        >
                                                            {getRecordStatus(record)}
                                                        </span>
                                                    </td>

                                                    {/* More Detail Values (Text, Dropdown) */}
                                                    {moreDetailTopics.map((topic, idx) => (
                                                        <td key={`md-${idx}`} className="text-center border-start bg-primary bg-opacity-10">
                                                            {getDisplayValue(record, topic.name)}
                                                        </td>
                                                    ))}

                                                    {/* Image Values */}
                                                    {imageTopics.map((topic, idx) => (
                                                        <td key={`img-${idx}`} className="text-center border-start bg-info bg-opacity-10">
                                                            {getDisplayValue(record, topic.name)}
                                                        </td>
                                                    ))}

                                                    {/* Checklist Values (OK/NG, Numeric) */}
                                                    {checklistTopics.map((topic, idx) => (
                                                        <td key={`cl-${idx}`} className={`text-center border-start bg-success bg-opacity-10 ${getStatusColor(record, topic.name)}`}>
                                                            {getDisplayValue(record, topic.name)}
                                                        </td>
                                                    ))}

                                                    {/* [NEW] Sub-Item Values - pass true for isActualSubItem */}
                                                    {subItemTopics.map((topic, idx) => (
                                                        <td key={`sub-${idx}`} className={`text-center border-start bg-warning bg-opacity-10 ${getStatusColor(record, topic.name, true)}`}>
                                                            {getDisplayValue(record, topic.name, true)}
                                                        </td>
                                                    ))}

                                                    <td className="border-end">
                                                        <div
                                                            className="text-truncate"
                                                            style={{ maxWidth: "150px" }}
                                                            title={record.remark}
                                                        >
                                                            {record.remark || "-"}
                                                        </div>
                                                    </td>
                                                    {/* Right Sticky Column: Actions */}
                                                    <td className="text-center pe-4 sticky-col-right" style={{ right: 0 }}>
                                                        <div className="d-flex gap-2 justify-content-center">
                                                            <button
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() => {
                                                                    const returnUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
                                                                    router.push(`/pm/inspect/${record.id}?mode=view&returnTo=${returnUrl}`);
                                                                }}
                                                            >
                                                                <i className="bi bi-eye me-1"></i>View
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-warning text-white"
                                                                onClick={() => {
                                                                    const returnUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
                                                                    router.push(`/pm/inspect/${record.id}?mode=edit&returnTo=${returnUrl}`);
                                                                }}
                                                            >
                                                                <i className="bi bi-pencil me-1"></i>Edit
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => handleDelete(record.id)}
                                                            >
                                                                <i className="bi bi-trash me-1"></i>Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            <div className="d-flex justify-content-center py-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalItems={totalItems}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export function generateStaticParams() {
    return [];
}
