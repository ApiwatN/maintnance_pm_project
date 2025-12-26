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
    const [filteredRecords, setFilteredRecords] = useState<PMRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedPMType, setSelectedPMType] = useState("");
    const [pmTypes, setPMTypes] = useState<{ id: number; name: string }[]>([]);

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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Generate year options (current year ± 5 years)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString());

    // Fetch dropdown data on mount
    useEffect(() => {
        if (authLoading) return;
        Promise.all([
            axios.get(`${config.apiServer}/api/areas`),
            axios.get(`${config.apiServer}/api/machine-types`),
            axios.get(`${config.apiServer}/api/machines`)
        ]).then(([areasRes, typesRes, machinesRes]) => {
            setAreas(areasRes.data);
            setMachineTypes(typesRes.data);
            setAllMachines(machinesRes.data);

            // Set initial machine details from URL param
            if (initialMachineId) {
                const initialMachine = machinesRes.data.find((m: MachineOption) => m.id === parseInt(initialMachineId));
                if (initialMachine) {
                    setSelectedMachineName(initialMachine.name);
                    setSelectedArea(initialMachine.machineMaster?.machineType?.area?.name || "");
                    setSelectedType(initialMachine.machineMaster?.machineType?.name || "");
                }
            }
        }).catch(console.error);
    }, [initialMachineId, authLoading]);

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
        // Fetch even if empty (All machines)
        fetchHistory();
    }, [selectedMachineId, selectedYear, authLoading]);

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
        filterRecords();
    }, [records, selectedPMType]);

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

        // Fetch both: history records AND machine details (only if specific machine)
        const requests = [
            axios.get(`${config.apiServer}/api/pm/machine/${targetId}/history?year=${selectedYear}`)
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
                const records = historyRes.data;
                const machine = machineRes.data;

                setRecords(records);
                if (machine) {
                    setSelectedMachineName(machine.name);
                } else if (!selectedMachineId) {
                    setSelectedMachineName("All Machines");
                }

                // Get PM Types from machine's pmPlans (not from records)
                const plansTypes = machine?.pmPlans?.map((p: any) => ({
                    id: p.preventiveType?.id || p.preventiveTypeId,
                    name: p.preventiveType?.name || `Type ${p.preventiveTypeId}`
                })).filter((t: any) => t.id) || [];

                // Also extract from records as fallback for legacy data
                const recordTypes = Array.from(
                    new Map(
                        records
                            .filter((r: PMRecord) => r.preventiveType)
                            .map((r: PMRecord) => [
                                r.preventiveType!.id,
                                { id: r.preventiveType!.id, name: r.preventiveType!.name }
                            ])
                    ).values()
                );

                // Merge and dedupe
                const allTypesMap = new Map();
                [...plansTypes, ...recordTypes].forEach((t: any) => {
                    if (t.id) allTypesMap.set(t.id, t);
                });
                const types = Array.from(allTypesMap.values());

                setPMTypes(types as { id: number; name: string }[]);

                // Prioritize typeId from URL, otherwise use first type
                const urlTypeId = searchParams.get('typeId');
                if (urlTypeId && types.some((t: any) => t.id === parseInt(urlTypeId))) {
                    setSelectedPMType(urlTypeId);
                } else if (types.length > 0 && !selectedPMType) {
                    setSelectedPMType((types as any[])[0].id.toString());
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

    const filterRecords = () => {
        let filtered = records;

        // Filter by PM Type
        if (selectedPMType) {
            filtered = filtered.filter(r => r.preventiveType?.id === parseInt(selectedPMType));
        }

        // Separate topics into Checklists (BOOLEAN, NUMERIC), Images (IMAGE), and More Details (TEXT, DROPDOWN)
        // [FIX] Include order field for sorting
        const checklistMap = new Map<string, { name: string, display: string, type: string, order: number, masterChecklist?: any }>();
        const imageMap = new Map<string, { name: string, display: string, type: string, order: number }>();
        const detailsMap = new Map<string, { name: string, display: string, type: string, order: number }>();

        // Collect from Details
        filtered.forEach(record => {
            record.details.forEach(detail => {
                const topicName = detail.masterChecklist?.topic || detail.topic;
                const type = detail.masterChecklist?.type || detail.checklist?.type || 'BOOLEAN';
                const master = detail.masterChecklist || detail.checklist;
                const order = (master as any)?.order ?? 9999; // Default high order for items without order

                if (topicName) {
                    let displayName = topicName;

                    // For Numeric, check if it's dynamic
                    let isDynamic = false;
                    if (type === 'NUMERIC' && master?.options) {
                        try {
                            const parsed = JSON.parse(master.options);
                            if (parsed.parentId && parsed.conditions) isDynamic = true;
                        } catch { }
                    }

                    if (type === 'NUMERIC' && !isDynamic && master?.minVal !== undefined && master?.maxVal !== undefined) {
                        displayName = `${topicName} (${master.minVal}-${master.maxVal})`;
                    } else if (type === 'NUMERIC' && isDynamic) {
                        displayName = `${topicName} (Dynamic)`;
                    }

                    if (type === 'BOOLEAN' || type === 'NUMERIC') {
                        if (!checklistMap.has(topicName)) {
                            checklistMap.set(topicName, { name: topicName, display: displayName, type, order, masterChecklist: master });
                        }
                    } else if (type === 'IMAGE') {
                        if (!imageMap.has(topicName)) {
                            imageMap.set(topicName, { name: topicName, display: topicName, type, order });
                        }
                    } else if (type === 'TEXT' || type === 'DROPDOWN') {
                        if (!detailsMap.has(topicName)) {
                            detailsMap.set(topicName, { name: topicName, display: topicName, type, order });
                        }
                    }
                }
            });
        });

        // [FIX] Collect Sub-Item topics from MasterChecklist.options.subItems
        // This ensures sub-items are shown even if no records exist yet
        const checklistSubItemsMap = new Map<string, { name: string, display: string, type: string, parentTopic: string, order: number }>();
        const detailSubItemsMap = new Map<string, { name: string, display: string, type: string, parentTopic: string, order: number }>();

        // First, collect from preventiveType.masterChecklists (configuration)
        filtered.forEach(record => {
            const masterChecklists = record.preventiveType?.masterChecklists || [];
            masterChecklists.forEach((mc: any) => {
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
                                    if (!detailSubItemsMap.has(key)) {
                                        detailSubItemsMap.set(key, entry);
                                    }
                                } else {
                                    if (!checklistSubItemsMap.has(key)) {
                                        checklistSubItemsMap.set(key, entry);
                                    }
                                }
                            });
                        }
                    } catch { /* ignore parse errors */ }
                }
            });
        });

        // Also collect from record.details for legacy records
        filtered.forEach(record => {
            record.details.forEach((detail: any) => {
                if (detail.subItemName) {
                    const baseTopic = detail.topic?.split(' : ')[0] || detail.masterChecklist?.topic || 'Unknown';
                    const displayName = `${baseTopic} : ${detail.subItemName}`;
                    const key = displayName;
                    const type = detail.masterChecklist?.type || 'BOOLEAN';
                    const order = detail.masterChecklist?.order ?? 9999;

                    const entry = {
                        name: key,
                        display: displayName,
                        type: type,
                        parentTopic: baseTopic,
                        order: order
                    };

                    if (type === 'TEXT' || type === 'DROPDOWN') {
                        if (!detailSubItemsMap.has(key)) {
                            detailSubItemsMap.set(key, entry);
                        }
                    } else {
                        if (!checklistSubItemsMap.has(key)) {
                            checklistSubItemsMap.set(key, entry);
                        }
                    }
                }
            });
        });

        // [FIX] Sort by order before setting state
        setChecklistTopics(Array.from(checklistMap.values()).sort((a, b) => a.order - b.order));
        setImageTopics(Array.from(imageMap.values()).sort((a, b) => a.order - b.order));
        setMoreDetailTopics(Array.from(detailsMap.values()).sort((a, b) => a.order - b.order));
        // [NEW] Combine both types into subItemTopics, sorted by order
        setSubItemTopics([
            ...Array.from(detailSubItemsMap.values()).sort((a, b) => a.order - b.order),
            ...Array.from(checklistSubItemsMap.values()).sort((a, b) => a.order - b.order)
        ]);

        setFilteredRecords(filtered);
        setCurrentPage(1);
    };

    const getValue = (record: PMRecord, topic: string) => {
        // [NEW] Check if topic contains " : " which indicates a Sub-Item format
        const isSubItemSearch = topic.includes(' : ');

        const detail = record.details.find((d: any) => {
            const resolvedTopic = d.masterChecklist?.topic || d.topic;

            if (isSubItemSearch) {
                // For Sub-Item: match "baseTopic : subItemName" format
                const [baseTopic, subItemName] = topic.split(' : ');
                const detailBaseTopic = resolvedTopic?.split(' : ')[0] || resolvedTopic;

                // DEBUG: Log sub-item matching
                if (d.subItemName) {
                    console.log('SubItem Search:', {
                        searchTopic: topic,
                        baseTopic,
                        subItemName,
                        detailTopic: d.topic,
                        detailSubItemName: d.subItemName,
                        resolvedTopic,
                        detailBaseTopic,
                        match: (detailBaseTopic === baseTopic || resolvedTopic === baseTopic) && d.subItemName === subItemName
                    });
                }

                return (detailBaseTopic === baseTopic || resolvedTopic === baseTopic) && d.subItemName === subItemName;
            }
            return resolvedTopic === topic;
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

    const getDisplayValue = (record: PMRecord, topic: string) => {
        // [NEW] Check if topic contains " : " which indicates a Sub-Item format
        const isSubItemSearch = topic.includes(' : ');

        const detail = record.details.find((d: any) => {
            const resolvedTopic = d.masterChecklist?.topic || d.topic;

            if (isSubItemSearch) {
                // For Sub-Item: match "baseTopic : subItemName" format
                const [baseTopic, subItemName] = topic.split(' : ');
                const detailBaseTopic = resolvedTopic?.split(' : ')[0] || resolvedTopic;
                return (detailBaseTopic === baseTopic || resolvedTopic === baseTopic) && d.subItemName === subItemName;
            }
            return resolvedTopic === topic;
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

    const getStatusColor = (record: PMRecord, topic: string) => {
        // [NEW] Check if topic contains " : " which indicates a Sub-Item format
        const isSubItemSearch = topic.includes(' : ');

        const detail = record.details.find((d: any) => {
            const resolvedTopic = d.masterChecklist?.topic || d.topic;

            if (isSubItemSearch) {
                // For Sub-Item: match "baseTopic : subItemName" format
                const [baseTopic, subItemName] = topic.split(' : ');
                const detailBaseTopic = resolvedTopic?.split(' : ')[0] || resolvedTopic;
                return (detailBaseTopic === baseTopic || resolvedTopic === baseTopic) && d.subItemName === subItemName;
            }
            return resolvedTopic === topic;
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

    const exportToExcel = () => {
        const pmTypeName = pmTypes.find(t => t.id === parseInt(selectedPMType))?.name || 'All';
        const areaLabel = selectedArea || 'AllAreas';
        const typeLabel = selectedType || 'AllTypes';
        const machineLabel = selectedMachineName || 'AllMachines';

        const data = filteredRecords.map((record, index) => {
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
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'PM History');
        XLSX.writeFile(wb, `PM_History_${areaLabel}_${typeLabel}_${machineLabel}_${pmTypeName}_${selectedYear}.xlsx`);
    };

    const exportToPDF = () => {
        const pmTypeName = pmTypes.find(t => t.id === parseInt(selectedPMType))?.name || 'All';
        const areaLabel = selectedArea || 'All Areas';
        const typeLabel = selectedType || 'All Types';
        const machineLabel = selectedMachineName || 'All Machines';
        const doc = new jsPDF('l', 'mm', 'a4');

        doc.setFontSize(16);
        doc.text(`PM History - ${machineLabel} (${pmTypeName})`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Area: ${areaLabel} | Type: ${typeLabel} | Year: ${selectedYear}`, 14, 22);

        const headers = [
            'No', 'Date', 'Time', 'Machine', 'Inspector', 'Checker', 'Status',
            ...allTopics.map(t => t.display),
            'Remark'
        ];

        const data = filteredRecords.map((record, index) => [
            index + 1,
            new Date(record.date).toLocaleDateString('th-TH'),
            new Date(record.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            record.machine.name,
            record.inspector,
            record.checker,
            getRecordStatus(record), // Use calculated status
            ...allTopics.map(topic => getValue(record, topic.name)),
            record.remark || '-'
        ]);

        autoTable(doc, {
            head: [headers],
            body: data,
            startY: 28,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [13, 110, 253] },
            columnStyles: {
                0: { cellWidth: 10 },
            },
        });

        doc.save(`PM_History_${areaLabel}_${typeLabel}_${machineLabel}_${pmTypeName}_${selectedYear}.pdf`);
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);

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
                    position: sticky !important;
                    z-index: 1020;
                    background-color: var(--bs-light);
                    box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.1); /* Add shadow for better visibility */
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
                    z-index: 1050;
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
                    <button
                        className="btn btn-success shadow-sm"
                        onClick={exportToExcel}
                        disabled={filteredRecords.length === 0}
                    >
                        <i className="bi bi-file-earmark-excel me-2"></i>Export Excel
                    </button>
                    <button
                        className="btn btn-danger shadow-sm"
                        onClick={exportToPDF}
                        disabled={filteredRecords.length === 0}
                    >
                        <i className="bi bi-file-earmark-pdf me-2"></i>Export PDF
                    </button>
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
                                    const machine = filteredMachines.find(m => m.id === parseInt(e.target.value));
                                    setSelectedMachineId(e.target.value);
                                    setSelectedMachineName(machine?.name || "");
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
                                <option value="">All PM Types</option>
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
                                    {filteredRecords.length} Found
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
                    ) : filteredRecords.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
                            No PM records found for the selected filters
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive" style={{ overflowX: 'auto' }}>
                                <table className="table table-hover table-bordered border-secondary align-middle mb-0">
                                    <thead className="bg-light text-secondary sticky-top" style={{ zIndex: 1020 }}>
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
                                        {currentItems.map((record, index) => (
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

                                                {/* [NEW] Sub-Item Values */}
                                                {subItemTopics.map((topic, idx) => (
                                                    <td key={`sub-${idx}`} className={`text-center border-start bg-warning bg-opacity-10 ${getStatusColor(record, topic.name)}`}>
                                                        {getDisplayValue(record, topic.name)}
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
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination */}
                            <div className="d-flex justify-content-center py-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalItems={filteredRecords.length}
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
