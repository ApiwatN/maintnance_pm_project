"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import config from "../../../config";
import axios from "axios";
import Swal from 'sweetalert2';
import { useAuth } from "../../../../context/AuthContext";

// [NEW] Camera Modal Component
const CameraModal = ({ isOpen, onClose, onCapture }: { isOpen: boolean, onClose: () => void, onCapture: (imageSrc: string) => void }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      Swal.fire("Error", "Cannot access camera. Please check permissions.", "error");
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capture = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageSrc = canvas.toDataURL("image/jpeg");
        onCapture(imageSrc);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Take Photo</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body text-center p-0 bg-dark">
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: '60vh' }}></video>
          </div>
          <div className="modal-footer justify-content-center">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary btn-lg" onClick={capture}>
              <i className="bi bi-camera-fill me-2"></i>Capture
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface Checklist {
  id: number;
  topic: string;
  type: string;
  minVal?: number;
  maxVal?: number;
  image?: string;
  options?: string; // JSON string
  isRequired?: boolean;
  isActive?: boolean;
}

interface Machine {
  id: number;
  code: string;
  name: string;
  model: string;
  location: string;
  checklists: Checklist[];
  pmPlans?: {
    id: number;
    preventiveTypeId: number;
    preventiveType: {
      name: string;
      image?: string;
      masterChecklists: Checklist[];
    };
    nextPMDate?: string;
    frequencyDays: number;
  }[];
}

interface PMRecord {
  id: number;
  date: string;
  inspector: string;
  checker: string;
  status: string;
  remark: string;
  machine: Machine;
  details: {
    id: number;
    checklistId: number;
    isPass: boolean;
    value: string;
    remark: string;
    checklist: Checklist;
    image?: string;
    imageBefore?: string;
    imageAfter?: string;
  }[];
}

export default function InspectionForm() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  const [machine, setMachine] = useState<Machine | null>(null);
  const [pmRecord, setPmRecord] = useState<PMRecord | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState<{
    inspector: string;
    checker: string;
    remark: string;
    details: { checklistId: number; isPass: boolean; value: string; remark: string; image?: string; imageBefore?: string; imageAfter?: string }[];
  }>({
    inspector: "",
    checker: "",
    remark: "",
    details: []
  });

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);

  // [NEW] Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<{ index: number, type: 'before' | 'after', position: string } | null>(null);

  const { loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (params.id) {
      if (isViewMode || isEditMode) {
        // View/Edit mode: fetch PM record
        fetchPMRecord(params.id as string);
        if (isEditMode) {
          fetchUsers();
        }
      } else {
        // New PM mode: fetch machine
        // New PM mode: fetch machine
        fetchMachine(params.id as string);
        fetchUsers(params.id as string);
      }
    }
  }, [params.id, isViewMode, isEditMode, loading]);

  useEffect(() => {
    if (!isViewMode && !isEditMode) {
      const savedInspector = localStorage.getItem('lastInspector');
      const savedChecker = localStorage.getItem('lastChecker');
      if (savedInspector || savedChecker) {
        setFormData(prev => ({
          ...prev,
          inspector: savedInspector || prev.inspector,
          checker: savedChecker || prev.checker
        }));
      }
    }
  }, [isViewMode, isEditMode]);

  const fetchUsers = (machineId?: string) => {
    let url = `${config.apiServer}/api/user-master`;
    if (machineId) {
      url += `?machineId=${machineId}`;
    }
    axios.get(url)
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  };

  const fetchPMRecord = (id: string) => {
    axios.get(`${config.apiServer}/api/pm/records/${id}`)
      .then((res) => {
        const record = res.data;
        setPmRecord(record);
        setPmRecord(record);
        setMachine(record.machine);

        // Fetch users for this machine (Edit/View mode)
        if (isEditMode) {
          fetchUsers(record.machine.id.toString());
        }

        // [FIX] Set selectedTypeId from record
        if (record.preventiveTypeId) {
          setSelectedTypeId(record.preventiveTypeId);
        }

        if (record.preventiveType) {
          setCurrentPlan({ preventiveType: record.preventiveType });
        } else if (record.preventiveTypeId && record.machine.pmPlans) {
          const plan = record.machine.pmPlans.find((p: any) => p.preventiveTypeId === record.preventiveTypeId);
          if (plan) setCurrentPlan(plan);
        }

        // [FIX] Extract subItemDetails from record.details that have subItemName
        const restoredSubItemDetails: any = {};
        const standardDetails: any[] = [];

        record.details.forEach((d: any) => {
          if (d.subItemName) {
            // This is a sub-item detail - find its index based on masterChecklist options
            const masterChecklist = record.preventiveType?.masterChecklists?.find(
              (mc: any) => mc.id === d.checklistId
            );

            if (masterChecklist?.options) {
              try {
                const opts = JSON.parse(masterChecklist.options);
                if (opts.subItems && Array.isArray(opts.subItems)) {
                  const subItemIndex = opts.subItems.indexOf(d.subItemName);
                  if (subItemIndex !== -1) {
                    const key = `${d.checklistId}_${subItemIndex}`;
                    restoredSubItemDetails[key] = {
                      checklistId: d.checklistId,
                      topic: masterChecklist.topic,
                      subItemName: d.subItemName,
                      isPass: d.isPass,
                      value: d.value || ""
                    };
                  }
                }
              } catch { /* ignore parse errors */ }
            }
          } else {
            // Standard detail
            standardDetails.push({
              checklistId: d.checklistId,
              isPass: d.isPass,
              value: d.value || "",
              remark: d.remark || "",
              image: d.image || "",
              imageBefore: d.imageBefore || "",
              imageAfter: d.imageAfter || ""
            });
          }
        });

        console.log('[DEBUG] Restored subItemDetails from record:', restoredSubItemDetails);

        // Populate form data with existing values
        setFormData({
          inspector: record.inspector,
          checker: record.checker,
          remark: record.remark,
          details: standardDetails,
          subItemDetails: restoredSubItemDetails
        } as any);
      })
      .catch((err) => console.error(err));
  };

  const fetchMachine = (id: string) => {
    axios.get(`${config.apiServer}/api/machines/${id}`)
      .then(async (res) => {
        const data = res.data;
        setMachine(data);

        let targetPlan: any = null;
        let sourceChecklists: Checklist[] = [];

        // 1. Check if typeId query param exists
        const typeIdParam = searchParams.get('typeId');

        if (data.pmPlans && data.pmPlans.length > 0) {
          if (typeIdParam) {
            targetPlan = data.pmPlans.find((p: any) => p.preventiveTypeId === parseInt(typeIdParam));
          } else if (data.pmPlans.length === 1) {
            // Auto-select the only plan
            targetPlan = data.pmPlans[0];
          } else {
            // Ambiguous: Multiple plans, no param. Prompt user.
            const options: any = {};
            data.pmPlans.forEach((p: any) => {
              options[p.preventiveTypeId] = p.preventiveType.name;
            });

            // [FIX] Set default value to first PM Type
            const firstTypeId = data.pmPlans[0].preventiveTypeId.toString();

            const { value: selectedType } = await Swal.fire({
              title: 'Select PM Type',
              input: 'select',
              inputOptions: options,
              inputValue: firstTypeId, // [FIX] Default to first PM Type
              inputPlaceholder: 'Select a PM Type',
              showCancelButton: false,
              allowOutsideClick: false,
              confirmButtonText: 'Continue'
            });

            if (selectedType) {
              targetPlan = data.pmPlans.find((p: any) => p.preventiveTypeId === parseInt(selectedType));
            } else {
              // [FIX] Fallback to first PM Type if nothing selected
              targetPlan = data.pmPlans[0];
            }
          }
        }

        if (targetPlan) {
          setSelectedTypeId(targetPlan.preventiveTypeId);
          setCurrentPlan(targetPlan);
          sourceChecklists = targetPlan.preventiveType.masterChecklists || [];
          // Filter out inactive items
          sourceChecklists = sourceChecklists.filter(c => c.isActive !== false);
        } else {
          // Fallback to legacy/ad-hoc checklists if no plan selected
          sourceChecklists = data.checklists || [];
          // Filter out inactive items (if applicable for legacy)
          sourceChecklists = sourceChecklists.filter(c => c.isActive !== false);
        }

        // Initialize details
        if (sourceChecklists.length > 0) {
          const initialDetails = sourceChecklists.map((c: Checklist) => ({
            checklistId: c.id,
            isPass: c.type !== 'NUMERIC', // Default pass except numeric
            value: "",
            remark: "",
            image: "",
            imageBefore: "",
            imageAfter: ""
          }));

          // [FIX] Initialize subItemDetails for all checklists with subItems
          const initialSubItemDetails: any = {};
          sourceChecklists.forEach((c: any) => {
            if (c.options) {
              try {
                const opts = JSON.parse(c.options);
                if (opts.subItems && Array.isArray(opts.subItems)) {
                  opts.subItems.forEach((subItemName: string, subItemIndex: number) => {
                    const key = `${c.id}_${subItemIndex}`; // Use checklist.id instead of index
                    initialSubItemDetails[key] = {
                      checklistId: c.id,
                      topic: c.topic,
                      subItemName: subItemName,
                      isPass: c.type !== 'NUMERIC', // Default OK for BOOLEAN
                      value: ""
                    };
                  });
                }
              } catch { /* ignore parse errors */ }
            }
          });

          console.log('[DEBUG] Initializing subItemDetails:', JSON.stringify(initialSubItemDetails, null, 2));
          console.log('[DEBUG] initialSubItemDetails keys:', Object.keys(initialSubItemDetails));

          setFormData((prev) => ({ ...prev, details: initialDetails, subItemDetails: initialSubItemDetails } as any));
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    if (!isViewMode && !isEditMode && machine && currentPlan && formData.details.length > 0) {
      // Load saved additional details
      const key = `pm_details_${machine.id}_${currentPlan.preventiveTypeId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(prev => {
            const newDetails = [...prev.details];
            let hasChanges = false;

            // Map saved values to details
            Object.keys(parsed).forEach(checklistIdStr => {
              const checklistId = parseInt(checklistIdStr);
              // Find index in details array
              const index = newDetails.findIndex(d => d.checklistId === checklistId);
              if (index !== -1) {
                // Only update if currently empty (don't overwrite if user already typed? 
                // Actually, this runs on mount/plan change, so likely empty. 
                // But safer to just overwrite as it's "restoring" state)
                if (newDetails[index].value !== parsed[checklistId]) {
                  newDetails[index] = { ...newDetails[index], value: parsed[checklistId] };
                  hasChanges = true;
                }
              }
            });

            return hasChanges ? { ...prev, details: newDetails } : prev;
          });
        } catch (e) {
          console.error("Failed to parse saved details", e);
        }
      }
    }
  }, [machine?.id, currentPlan?.preventiveTypeId, isViewMode, isEditMode, formData.details.length]);

  const handleImageUpload = (index: number, field: 'imageBefore' | 'imageAfter', position: string, file: File) => {
    if (!file) return;

    // Upload to server first
    const uploadData = new FormData();
    uploadData.append('image', file);

    axios.post(`${config.apiServer}/api/upload`, uploadData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => {
      const imageUrl = `${config.apiServer}${res.data.path}`;
      updateImageField(index, field, position, imageUrl);
    }).catch(err => {
      console.error("Upload failed", err);
      Swal.fire("Error", "Failed to upload image", "error");
    });
  };

  const updateImageField = (index: number, field: 'imageBefore' | 'imageAfter', position: string, imageUrl: string) => {
    const newDetails = [...formData.details];
    const currentDetail = newDetails[index];

    // Parse existing JSON or create new array
    let images: { label: string, url: string }[] = [];
    try {
      const raw = currentDetail[field];
      if (raw && raw.startsWith('[')) {
        images = JSON.parse(raw);
      } else if (raw) {
        // Legacy: single string
        images = [{ label: 'Default', url: raw }];
      }
    } catch {
      images = [];
    }

    // Update or Add
    const existingIdx = images.findIndex(img => img.label === position);
    if (existingIdx >= 0) {
      images[existingIdx].url = imageUrl;
    } else {
      images.push({ label: position, url: imageUrl });
    }

    newDetails[index] = { ...currentDetail, [field]: JSON.stringify(images) };
    setFormData({ ...formData, details: newDetails });
  };

  const openCamera = (index: number, type: 'before' | 'after', position: string) => {
    setCameraTarget({ index, type, position });
    setIsCameraOpen(true);
  };

  const handleCameraCapture = (imageSrc: string) => {
    if (cameraTarget) {
      // Convert Base64 to Blob and upload (or save base64 directly? Better upload for size)
      // For simplicity/speed, let's upload base64 as file
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });

          const uploadData = new FormData();
          uploadData.append('image', file);

          axios.post(`${config.apiServer}/api/upload`, uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          }).then(res => {
            const imageUrl = `${config.apiServer}${res.data.path}`;
            updateImageField(cameraTarget.index, cameraTarget.type === 'before' ? 'imageBefore' : 'imageAfter', cameraTarget.position, imageUrl);
          }).catch(err => console.error(err));
        });
    }
  };

  const resolveMinMax = (checklist: Checklist, currentDetails: any[]) => {
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

  const handleDetailChange = (index: number, field: string, value: any) => {
    const newDetails = [...formData.details];
    newDetails[index] = { ...newDetails[index], [field]: value };

    // Determine which checklists we are using (Must match render logic)
    // Determine which checklists we are using (Must match render logic)
    const rawChecklists = currentPlan?.preventiveType?.masterChecklists || machine?.checklists || [];
    const currentChecklists = rawChecklists.filter((c: any) => c.isActive !== false);
    const currentChecklist = currentChecklists[index];

    // Re-validate all Numeric items (because a Parent might have changed, or the item itself changed)
    newDetails.forEach((d, idx) => {
      const checklist = currentChecklists[idx];
      if (checklist?.type === 'NUMERIC') {
        const val = parseFloat(d.value);
        const { min, max } = resolveMinMax(checklist, newDetails);
        if (!isNaN(val) && min !== undefined && max !== undefined) {
          d.isPass = val >= min && val <= max;
        }
      }
    });

    setFormData({ ...formData, details: newDetails });

    // Save to LocalStorage if it is an "Additional Detail" (TEXT or DROPDOWN)
    if (!isViewMode && !isEditMode && machine && currentPlan && field === 'value') {
      const checklistType = currentChecklist?.type;
      if (checklistType === 'TEXT' || checklistType === 'DROPDOWN') {
        const key = `pm_details_${machine.id}_${currentPlan.preventiveTypeId}`;
        const checklistId = newDetails[index].checklistId;
        const valueToSave = value; // The new value

        // We need to read current storage to merge, or maintain a separate state?
        // Reading from LS every keystroke is okay but maybe debouncing is better? 
        // For simplicity and robustness: Read, Update, Save.
        try {
          const existing = localStorage.getItem(key);
          const data = existing ? JSON.parse(existing) : {};
          data[checklistId] = valueToSave;
          localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
          console.error("Failed to save detail", e);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Check 'isRequired' fields
    // Validation: Check 'isRequired' fields
    const rawChecklists = currentPlan?.preventiveType?.masterChecklists || machine?.checklists || [];
    const currentChecklists = rawChecklists.filter((c: any) => c.isActive !== false);
    const missingFields: string[] = [];

    currentChecklists.forEach((checklist: any, index: number) => {
      if (checklist.isRequired) {
        const detail = formData.details[index];
        if (!detail) {
          missingFields.push(checklist.topic);
          return;
        }

        if (checklist.type === 'BOOLEAN') {
          if (detail.isPass === undefined || detail.isPass === null) {
            missingFields.push(checklist.topic);
          }
          if (detail.isPass === undefined || detail.isPass === null) {
            missingFields.push(checklist.topic);
          }
        } else if (checklist.type === 'IMAGE') {
          // Check if at least one image exists for Before (if configured)
          // Actually, if required, maybe ALL configured positions are required?
          // Let's assume if "Required", at least one image in Before is needed.
          if ((!detail.imageBefore || detail.imageBefore === "[]") && (!detail.imageAfter || detail.imageAfter === "[]")) {
            missingFields.push(checklist.topic + " (Image Required)");
          }
        } else {
          // NUMERIC, TEXT, DROPDOWN use value
          if (!detail.value || detail.value.toString().trim() === "") {
            missingFields.push(checklist.topic);
          }
        }
      }
    });

    if (missingFields.length > 0) {
      Swal.fire({
        title: 'Missing Required Fields',
        html: `Please fill in the following required fields:<br/><ul class="text-start mt-2"><li>${missingFields.join('</li><li>')}</li></ul>`,
        icon: 'error'
      });
      return;
    }

    Swal.fire({
      title: isEditMode ? 'Confirm Update' : 'Confirm Submission',
      text: isEditMode ? "Are you sure you want to update this inspection result?" : "Are you sure you want to submit this inspection result?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: isEditMode ? 'Yes, update it!' : 'Yes, submit it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const allPass = formData.details.every(d => d.isPass);

        // Calculate status based on Due Date (nextPMDate from plan)
        let status = "COMPLETED";
        if (currentPlan?.nextPMDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dueDate = new Date(currentPlan.nextPMDate);
          dueDate.setHours(0, 0, 0, 0);

          if (today > dueDate) {
            status = "LATE";
          }
        }

        console.log('[DEBUG] Before Submit - formData.subItemDetails:', (formData as any).subItemDetails);
        console.log('[DEBUG] Before Submit - selectedTypeId:', selectedTypeId);

        const payload = {
          machineId: machine?.id,
          inspector: formData.inspector,
          checker: formData.checker,
          status: status,
          remark: formData.remark,
          details: formData.details.map((d, index) => ({
            ...d,
            topic: currentChecklists[index]?.topic || "",
            checklistId: d.checklistId
          })),
          preventiveTypeId: selectedTypeId, // Include selected type
          subItemDetails: (formData as any).subItemDetails || {} // [FIX] Include sub-item details
        };

        console.log('[DEBUG] Payload subItemDetails:', payload.subItemDetails);

        const apiCall = isEditMode
          ? axios.put(`${config.apiServer}/api/pm/records/${params.id}`, payload)
          : axios.post(`${config.apiServer}/api/pm/record`, payload);

        apiCall
          .then((res) => {
            Swal.fire({
              title: isEditMode ? 'Updated!' : 'Submitted!',
              text: isEditMode ? 'PM Record has been updated.' : 'PM Record has been saved.',
              icon: 'success',
              timer: 300,
              showConfirmButton: false
            }).then(() => {
              router.push(searchParams.get('returnTo') || "/");
            });
          })
          .catch((err: any) => {
            console.error(err);
            const errorMsg = err.response?.data?.error || (isEditMode ? 'Failed to update record.' : 'Failed to save record.');
            Swal.fire(
              'Error!',
              errorMsg,
              'error'
            );
          });
      }
    });
  };

  if (!machine) return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;

  const inspectors = users.filter(u => u.role === 'INSPECTOR' || u.role === 'BOTH');
  const checkers = users.filter(u => u.role === 'CHECKER' || u.role === 'BOTH');

  // [FIX] Filter out inactive items for rendering to match formData.details
  // But in View/Edit mode, we should show ALL items (even inactive) to preserve history
  const rawChecklists = currentPlan?.preventiveType?.masterChecklists || machine.checklists || [];
  const checklists = rawChecklists.filter((c: any) => {
    if (isViewMode || isEditMode) return true; // Show all in View/Edit
    return c.isActive !== false; // Hide inactive in New Mode
  });

  // Filter checklists based on type

  // [NEW] Helper to safely parse options JSON (moved before filters)
  const safeParseOptions = (optionsStr?: string) => {
    try {
      return optionsStr ? JSON.parse(optionsStr) : {};
    } catch {
      return {};
    }
  };

  const imageChecklists = checklists.filter((c: any) => c.type === 'IMAGE');
  const standardChecklists = checklists.filter((c: any) => {
    // Only show items WITHOUT subItems in standard table
    const opts = safeParseOptions(c.options);
    const hasSubItems = opts.subItems && opts.subItems.length > 0;
    return (c.type === 'BOOLEAN' || c.type === 'NUMERIC') && !hasSubItems;
  });
  const detailChecklists = checklists.filter((c: any) => c.type === 'TEXT' || c.type === 'DROPDOWN');

  // [NEW] Filter Sub-Item checklists (items WITH subItems)
  const subItemChecklists = checklists.filter((c: any) => {
    const opts = safeParseOptions(c.options);
    return opts.subItems && opts.subItems.length > 0;
  });

  // Split standard checklists for 2-col layout
  const midPoint = Math.ceil(standardChecklists.length / 2);
  const leftChecklists = standardChecklists.slice(0, midPoint);
  const rightChecklists = standardChecklists.slice(midPoint);

  const getGlobalIndex = (item: Checklist) => checklists.findIndex((c: any) => c.id === item.id);

  // Helper to determine decimal precision
  const decPrecision = (n?: number) => {
    if (n === undefined || n === null) return 0;
    const s = n.toString();
    if (s.indexOf('.') === -1) return 0;
    return s.length - s.indexOf('.') - 1;
  };

  const renderImageSection = () => {
    if (imageChecklists.length === 0) return null;
    return (
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-info text-white py-3">
          <h5 className="mb-0 fw-bold"><i className="bi bi-images me-2"></i>Image Evidence</h5>
        </div>
        <div className="card-body">
          {imageChecklists.map((checklist: any) => {
            const globalIndex = getGlobalIndex(checklist);
            const detail = formData.details[globalIndex];

            // Parse Config
            let config = { before: [], after: [] };
            try {
              config = JSON.parse(checklist.options || "{}");
            } catch { }
            const beforePositions = Array.isArray(config.before) && config.before.length > 0 ? config.before : ['Default'];
            const afterPositions = Array.isArray(config.after) && config.after.length > 0 ? config.after : ['Default'];

            // Parse Current Values
            const parseImages = (jsonStr?: string) => {
              try {
                if (!jsonStr) return [];
                if (jsonStr.startsWith('[')) return JSON.parse(jsonStr);
                return [{ label: 'Default', url: jsonStr }];
              } catch { return []; }
            };
            const currentBefore = parseImages(detail?.imageBefore);
            const currentAfter = parseImages(detail?.imageAfter);

            const renderImageInput = (pos: string, type: 'before' | 'after', currentImages: any[]) => {
              const img = currentImages.find((i: any) => i.label === pos);
              return (
                <div key={`${type}-${pos}`} className="d-flex flex-column align-items-center border rounded p-2 bg-white shadow-sm" style={{ minWidth: '120px' }}>
                  <small className="fw-bold mb-1 text-muted">{pos}</small>
                  <div className="mb-2 position-relative" style={{ width: '100px', height: '100px', backgroundColor: '#f8f9fa' }}>
                    {img ? (
                      <img src={img.url} alt={pos} className="w-100 h-100 object-fit-cover rounded" />
                    ) : (
                      <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                        <i className="bi bi-image fs-1 opacity-25"></i>
                      </div>
                    )}
                  </div>
                  <div className="d-flex gap-1 w-100">
                    {!isViewMode && (
                      <>
                        <label className="btn btn-sm btn-outline-primary flex-grow-1 py-1" title="Upload">
                          <i className="bi bi-upload"></i>
                          <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => e.target.files && handleImageUpload(globalIndex, type === 'before' ? 'imageBefore' : 'imageAfter', pos, e.target.files[0])} disabled={isViewMode} />
                        </label>
                        <button type="button" className="btn btn-sm btn-outline-secondary flex-grow-1 py-1" title="Camera" onClick={() => openCamera(globalIndex, type === 'before' ? 'imageBefore' : 'imageAfter' as any, pos)} disabled={isViewMode}>
                          <i className="bi bi-camera"></i>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            };

            return (
              <div key={checklist.id} className="mb-4 border-bottom pb-4 last-no-border">
                <h6 className="fw-bold mb-3">{checklist.topic}</h6>
                <div className="row g-4">
                  <div className="col-md-6 border-end">
                    <div className="d-flex align-items-center mb-2">
                      <span className="badge bg-secondary me-2">BEFORE</span>
                      <small className="text-muted">Images taken before maintenance</small>
                    </div>
                    <div className="d-flex flex-wrap gap-3">
                      {beforePositions.map((pos: string) => renderImageInput(pos, 'before', currentBefore))}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="d-flex align-items-center mb-2">
                      <span className="badge bg-success me-2">AFTER</span>
                      <small className="text-muted">Images taken after maintenance</small>
                    </div>
                    <div className="d-flex flex-wrap gap-3">
                      {afterPositions.map((pos: string) => renderImageInput(pos, 'after', currentAfter))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  // [NEW] Render Sub-Item Section (Horizontal Layout) - Grouped by same subItems
  const renderSubItemSection = () => {
    if (subItemChecklists.length === 0) return null;

    // Group checklists by their subItems (as JSON string for comparison)
    const groups: { [key: string]: { subItems: string[]; checklists: any[] } } = {};
    subItemChecklists.forEach((checklist: any) => {
      const opts = safeParseOptions(checklist.options);
      const subItems: string[] = opts.subItems || [];
      const key = JSON.stringify(subItems); // Use JSON string as grouping key
      if (!groups[key]) {
        groups[key] = { subItems, checklists: [] };
      }
      groups[key].checklists.push(checklist);
    });

    return (
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-info bg-opacity-75 text-white py-3">
          <h5 className="mb-0 fw-bold"><i className="bi bi-layers me-2"></i>Detailed Inspection (Sub-Items)</h5>
        </div>
        <div className="card-body p-0">
          {Object.entries(groups).map(([key, group]) => {
            const subItemNames = group.subItems;
            return (
              <div key={key} className="p-3 border-bottom">
                <div className="table-responsive">
                  <table className="table table-sm table-bordered table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '200px' }}>Topic</th>
                        {subItemNames.map((name, idx) => (
                          <th key={idx} className="text-center" style={{ minWidth: '90px' }}>{name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.checklists.map((checklist: any) => {
                        return (
                          <tr key={checklist.id}>
                            <td className="fw-bold bg-light align-middle">
                              <i className="bi bi-check2-square me-2 text-primary"></i>
                              {checklist.topic}
                            </td>
                            {subItemNames.map((name, idx) => {
                              const subDetailKey = `${checklist.id}_${idx}`; // Use checklist.id instead of globalIndex
                              // [NEW] Default isPass to true (OK)
                              const subDetail = (formData as any).subItemDetails?.[subDetailKey] || { isPass: true };
                              return (
                                <td key={idx} className="text-center align-middle">
                                  {checklist.type === 'NUMERIC' ? (
                                    <input
                                      type="number"
                                      className="form-control form-control-sm text-center"
                                      placeholder="Value"
                                      style={{ minWidth: '60px' }}
                                      value={subDetail.value || ''}
                                      onChange={(e) => {
                                        const existingSubDetails = (formData as any).subItemDetails || {};
                                        const newSubDetails = { ...existingSubDetails };
                                        newSubDetails[subDetailKey] = {
                                          ...subDetail,
                                          value: e.target.value,
                                          checklistId: checklist.id,
                                          subItemName: name,
                                          topic: checklist.topic
                                        };
                                        setFormData({ ...formData, subItemDetails: newSubDetails } as any);
                                      }}
                                      disabled={isViewMode}
                                    />
                                  ) : (
                                    <div className="btn-group btn-group-sm" role="group">
                                      <input
                                        type="radio"
                                        className="btn-check"
                                        name={`subitem_${checklist.id}_${idx}`}
                                        id={`subitem_ok_${checklist.id}_${idx}`}
                                        checked={subDetail.isPass === true}
                                        onChange={() => {
                                          const existingSubDetails = (formData as any).subItemDetails || {};
                                          const newSubDetails = { ...existingSubDetails };
                                          newSubDetails[subDetailKey] = {
                                            ...subDetail,
                                            isPass: true,
                                            checklistId: checklist.id,
                                            subItemName: name,
                                            topic: checklist.topic
                                          };
                                          setFormData({ ...formData, subItemDetails: newSubDetails } as any);
                                        }}
                                        disabled={isViewMode}
                                      />
                                      <label className="btn btn-outline-success" htmlFor={`subitem_ok_${checklist.id}_${idx}`}>OK</label>
                                      <input
                                        type="radio"
                                        className="btn-check"
                                        name={`subitem_${checklist.id}_${idx}`}
                                        id={`subitem_ng_${checklist.id}_${idx}`}
                                        checked={subDetail.isPass === false}
                                        onChange={() => {
                                          const existingSubDetails = (formData as any).subItemDetails || {};
                                          const newSubDetails = { ...existingSubDetails };
                                          newSubDetails[subDetailKey] = {
                                            ...subDetail,
                                            isPass: false,
                                            checklistId: checklist.id,
                                            subItemName: name,
                                            topic: checklist.topic
                                          };
                                          setFormData({ ...formData, subItemDetails: newSubDetails } as any);
                                        }}
                                        disabled={isViewMode}
                                      />
                                      <label className="btn btn-outline-danger" htmlFor={`subitem_ng_${checklist.id}_${idx}`}>NG</label>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderChecklistTable = (items: Checklist[], title: string) => (
    <div className="card border-0 shadow-sm rounded-3 h-100">
      <div className="card-header bg-primary text-white py-3">
        <h5 className="mb-0 fw-bold"><i className="bi bi-list-check me-2"></i>{title}</h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light text-secondary">
              <tr>
                <th className="ps-3 py-3" style={{ width: '5%' }}>No</th>
                <th className="py-3" style={{ width: '25%' }}>Topic</th>
                <th className="py-3" style={{ width: '15%' }}>Criteria</th>
                <th className="py-3" style={{ width: '25%' }}>Input / Result</th>
                <th className="py-3 text-center" style={{ width: '10%' }}>Status</th>
                <th className="py-3 pe-3" style={{ width: '20%' }}>Remark</th>
              </tr>
            </thead>
            <tbody>
              {items.map((checklist) => {
                const globalIndex = getGlobalIndex(checklist); // Use global index for data binding
                const detail = formData.details[globalIndex];
                if (!detail) return null;

                // Calculate display index specific to Standard Checklists
                const displayIndex = standardChecklists.findIndex((c: any) => c.id === checklist.id);

                // Calculate dynamic step based on precision of minVal/maxVal
                const { min: resolvedMin, max: resolvedMax } = resolveMinMax(checklist, formData.details);

                let step = "1";
                if (checklist.type === 'NUMERIC') {
                  const p1 = decPrecision(resolvedMin);
                  const p2 = decPrecision(resolvedMax);
                  const maxP = Math.max(p1, p2);
                  if (maxP === 0) step = "1";
                  else step = `0.${"0".repeat(maxP - 1)}1`;
                }

                return (
                  <tr key={checklist.id}>
                    <td className="ps-3 fw-bold text-muted">{displayIndex + 1}</td>
                    <td><div className="fw-bold text-dark">{checklist.topic}</div></td>
                    <td>
                      {checklist.type === 'NUMERIC'
                        ? <span className="badge bg-info text-dark rounded-pill fw-normal px-2">Range: {resolvedMin} - {resolvedMax}</span>
                        : checklist.type === 'IMAGE'
                          ? <span className="badge bg-primary text-white rounded-pill fw-normal px-2">Image Evidence</span>
                          : <span className="badge bg-secondary text-white rounded-pill fw-normal px-2">OK / NG</span>}
                    </td>
                    <td>
                      <div className="mb-0">
                        {checklist.type === 'NUMERIC' ? (
                          <input
                            type="number"
                            step={step}
                            className="form-control form-control-sm"
                            placeholder="Value"
                            value={detail?.value || ''}
                            onChange={(e) => handleDetailChange(globalIndex, 'value', e.target.value)}
                            disabled={isViewMode}
                            readOnly={isViewMode}
                          />
                        ) : checklist.type === 'IMAGE' ? (
                          <div className="w-100">
                            {(() => {
                              // Parse Config
                              let config = { before: [], after: [] };
                              try {
                                config = JSON.parse(checklist.options || "{}");
                              } catch { }
                              const beforePositions = Array.isArray(config.before) && config.before.length > 0 ? config.before : ['Default'];
                              const afterPositions = Array.isArray(config.after) && config.after.length > 0 ? config.after : ['Default'];

                              // Parse Current Values
                              const parseImages = (jsonStr?: string) => {
                                try {
                                  if (!jsonStr) return [];
                                  if (jsonStr.startsWith('[')) return JSON.parse(jsonStr);
                                  return [{ label: 'Default', url: jsonStr }];
                                } catch { return []; }
                              };
                              const currentBefore = parseImages(detail?.imageBefore);
                              const currentAfter = parseImages(detail?.imageAfter);

                              const renderImageInput = (pos: string, type: 'before' | 'after', currentImages: any[]) => {
                                const img = currentImages.find((i: any) => i.label === pos);
                                return (
                                  <div key={`${type}-${pos}`} className="d-flex flex-column align-items-center border rounded p-2 bg-white shadow-sm" style={{ minWidth: '120px' }}>
                                    <small className="fw-bold mb-1 text-muted">{pos}</small>
                                    <div className="mb-2 position-relative" style={{ width: '80px', height: '80px', backgroundColor: '#f8f9fa' }}>
                                      {img ? (
                                        <img src={img.url} alt={pos} className="w-100 h-100 object-fit-cover rounded" />
                                      ) : (
                                        <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                                          <i className="bi bi-image fs-4"></i>
                                        </div>
                                      )}
                                    </div>
                                    <div className="d-flex gap-1 w-100">
                                      <label className="btn btn-xs btn-outline-primary flex-grow-1 py-0" title="Upload">
                                        <i className="bi bi-upload"></i>
                                        <input type="file" hidden accept="image/*" onChange={(e) => e.target.files && handleImageUpload(globalIndex, type === 'before' ? 'imageBefore' : 'imageAfter', pos, e.target.files[0])} disabled={isViewMode} />
                                      </label>
                                      <button type="button" className="btn btn-xs btn-outline-secondary flex-grow-1 py-0" title="Camera" onClick={() => openCamera(globalIndex, type === 'before' ? 'imageBefore' : 'imageAfter' as any, pos)} disabled={isViewMode}>
                                        <i className="bi bi-camera"></i>
                                      </button>
                                    </div>
                                  </div>
                                );
                              };

                              return (
                                <div className="d-flex flex-column gap-2">
                                  {/* Before Section */}
                                  <div className="d-flex align-items-center gap-2 overflow-auto pb-2">
                                    <span className="badge bg-secondary text-white" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '100px' }}>BEFORE</span>
                                    {beforePositions.map((pos: string) => renderImageInput(pos, 'before', currentBefore))}
                                  </div>
                                  {/* After Section */}
                                  <div className="d-flex align-items-center gap-2 overflow-auto pb-2 border-top pt-2">
                                    <span className="badge bg-success text-white" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '100px' }}>AFTER</span>
                                    {afterPositions.map((pos: string) => renderImageInput(pos, 'after', currentAfter))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="btn-group w-100 btn-group-sm" role="group">
                            <input type="radio" className="btn-check" name={`btnradio_${globalIndex}`} id={`btnradio1_${globalIndex}`} autoComplete="off"
                              checked={detail?.isPass === true}
                              onChange={() => handleDetailChange(globalIndex, 'isPass', true)}
                              disabled={isViewMode}
                            />
                            <label className="btn btn-outline-success" htmlFor={`btnradio1_${globalIndex}`}>OK</label>

                            <input type="radio" className="btn-check" name={`btnradio_${globalIndex}`} id={`btnradio2_${globalIndex}`} autoComplete="off"
                              checked={detail?.isPass === false}
                              onChange={() => handleDetailChange(globalIndex, 'isPass', false)}
                              disabled={isViewMode}
                            />
                            <label className="btn btn-outline-danger" htmlFor={`btnradio2_${globalIndex}`}>NG</label>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-center">
                      {detail?.isPass === true && (
                        <span className="badge bg-success">PASS</span>
                      )}
                      {detail?.isPass === false && (
                        <span className="badge bg-danger">FAIL</span>
                      )}
                    </td>
                    <td className="pe-3">
                      <textarea
                        className="form-control form-control-sm"
                        rows={1}
                        placeholder="Note..."
                        value={detail?.remark || ''}
                        onChange={(e) => handleDetailChange(globalIndex, 'remark', e.target.value)}
                        disabled={isViewMode}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-4 bg-light min-vh-100">
      <div className="container-fluid px-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-1">
              {isViewMode ? 'PM Inspection Record' : isEditMode ? 'Edit PM Inspection' : 'PM Inspection Form'}
            </h2>
            <p className="text-muted mb-0">
              {isViewMode ? 'ดูรายละเอียดการตรวจสอบ PM' : isEditMode ? 'แก้ไขการตรวจสอบ PM' : 'Complete the preventive maintenance checklist'}
            </p>
          </div>
          <Link
            href={searchParams.get('returnTo') || (isViewMode ? "/calendar" : "/")}
            className="btn btn-light shadow-sm border"
          >
            <i className="bi bi-arrow-left me-2"></i>
            {searchParams.get('returnTo')?.includes('history') ? 'Back to History' :
              searchParams.get('returnTo')?.includes('calendar') ? 'Back to Calendar' :
                isViewMode ? 'Back to Calendar' : 'Back to Dashboard'}
          </Link>
        </div>

        {/* Machine Details Card (Merged with Record Info for View Mode) */}
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-body p-4">
            {/* Record Info Section (Only in View Mode) */}
            {isViewMode && pmRecord && (
              <div className="row g-3 mb-4 border-bottom pb-3">
                <div className="col-md-3">
                  <label className="form-label fw-bold text-muted small">Record Date</label>
                  <p className="mb-0 fw-bold">{new Date(pmRecord.date).toLocaleDateString('th-TH')}</p>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-bold text-muted small">Status</label>
                  <p className="mb-0">
                    <span className={`badge ${pmRecord.status === 'COMPLETED' ? 'bg-success text-white' : 'bg-warning text-dark'}`}>
                      {pmRecord.status}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Machine Info Section */}
            <div className="row align-items-center">
              <div className="col-md-8">
                <h4 className="fw-bold text-primary mb-3">{machine.name}</h4>
                <div className="d-flex gap-4 text-muted">
                  <div><i className="bi bi-upc-scan me-2"></i>{machine.code}</div>
                  <div><i className="bi bi-box-seam me-2"></i>{machine.model || "-"}</div>
                  <div><i className="bi bi-geo-alt me-2"></i>{machine.location}</div>
                </div>
              </div>
              <div className="col-md-4 text-end">
                <span className="badge bg-primary text-white fs-6 px-3 py-2 rounded-pill">
                  PM Inspection
                </span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Reference Diagram */}
          {currentPlan?.preventiveType?.image && (
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-image me-2 text-primary"></i>Reference Diagram ({currentPlan.preventiveType.name})</h5>
              </div>
              <div className="card-body text-center bg-light">
                <img
                  src={`${config.apiServer}${currentPlan.preventiveType.image}`}
                  alt="Reference Diagram"
                  className="img-fluid rounded shadow-sm"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                />
              </div>
            </div>
          )}

          {/* Personnel Selection */}
          {!isViewMode && !isEditMode && (
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small">Inspector (ผู้ตรวจ)</label>
                    <select className="form-select form-select-lg bg-light border-0" value={formData.inspector} onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, inspector: val });
                      localStorage.setItem('lastInspector', val);
                    }} required>
                      <option value="">-- Select Inspector --</option>
                      {inspectors.map(u => (
                        <option key={u.id} value={`${u.name}${u.employeeId ? ` (${u.employeeId})` : ''}`}>
                          {u.name}{u.employeeId ? ` (${u.employeeId})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small">Checker (ผู้ตรวจสอบ)</label>
                    <select className="form-select form-select-lg bg-light border-0" value={formData.checker} onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, checker: val });
                      localStorage.setItem('lastChecker', val);
                    }} required>
                      <option value="">-- Select Checker --</option>
                      {checkers.map(u => (
                        <option key={u.id} value={`${u.name}${u.employeeId ? ` (${u.employeeId})` : ''}`}>
                          {u.name}{u.employeeId ? ` (${u.employeeId})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View/Edit Mode: Personnel Display/Selection */}
          {(isViewMode || isEditMode) && (
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small">Inspector (ผู้ตรวจ)</label>
                    {isViewMode ? (
                      <p className="mb-0 fw-bold text-dark">{formData.inspector}</p>
                    ) : (
                      <select className="form-select form-select-lg bg-light border-0" value={formData.inspector} onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, inspector: val });
                        localStorage.setItem('lastInspector', val);
                      }} required>
                        <option value="">-- Select Inspector --</option>
                        {inspectors.map(u => (
                          <option key={u.id} value={`${u.name}${u.employeeId ? ` (${u.employeeId})` : ''}`}>
                            {u.name}{u.employeeId ? ` (${u.employeeId})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small">Checker (ผู้ตรวจสอบ)</label>
                    {isViewMode ? (
                      <p className="mb-0 fw-bold text-dark">{formData.checker}</p>
                    ) : (
                      <select className="form-select form-select-lg bg-light border-0" value={formData.checker} onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, checker: val });
                        localStorage.setItem('lastChecker', val);
                      }} required>
                        <option value="">-- Select Checker --</option>
                        {checkers.map(u => (
                          <option key={u.id} value={`${u.name}${u.employeeId ? ` (${u.employeeId})` : ''}`}>
                            {u.name}{u.employeeId ? ` (${u.employeeId})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Standard Checklists - 2 Column Layout */}
          {/* Additional Details Section (Moved Up) */}
          {detailChecklists.length > 0 && (
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-header bg-info text-dark py-3">
                <h5 className="mb-0 fw-bold"><i className="bi bi-info-circle me-2"></i>Additional Details</h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  {detailChecklists.map((item: any) => {
                    const globalIndex = getGlobalIndex(item);
                    const detail = formData.details[globalIndex];
                    if (!detail) return null;
                    const options = item.options ? (() => {
                      try {
                        return JSON.parse(item.options);
                      } catch {
                        return item.options.split(',').map((o: string) => o.trim());
                      }
                    })() : [];

                    return (
                      <div className="col-md-6" key={item.id}>
                        <label className="form-label fw-bold text-muted small">
                          {item.topic} {item.isRequired && <span className="text-danger">*</span>}
                        </label>
                        {item.type === 'DROPDOWN' ? (
                          <>
                            <select
                              className="form-select"
                              value={detail?.value || ''}
                              onChange={(e) => handleDetailChange(globalIndex, 'value', e.target.value)}
                              disabled={isViewMode}
                            >
                              <option value="">-- Select --</option>
                              {options.map((opt: any, idx: number) => {
                                const label = typeof opt === 'string' ? opt : opt.label;
                                return <option key={idx} value={label}>{label}</option>;
                              })}
                            </select>
                            {/* Display Spec if available */}
                            {(() => {
                              if (!detail?.value) return null;
                              const selectedOpt = options.find((o: any) => (typeof o === 'string' ? o : o.label) === detail.value);
                              if (selectedOpt && typeof selectedOpt !== 'string' && selectedOpt.spec) {
                                return <div className="form-text text-info"><i className="bi bi-info-circle me-1"></i>Spec: {selectedOpt.spec}</div>;
                              }
                              return null;
                            })()}
                          </>
                        ) : (
                          <input
                            type="text"
                            className="form-control"
                            value={detail?.value || ''}
                            onChange={(e) => handleDetailChange(globalIndex, 'value', e.target.value)}
                            disabled={isViewMode}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Image Evidence Section */}
          {renderImageSection()}

          {/* [NEW] Sub-Item Section (Horizontal Layout) */}
          {renderSubItemSection()}

          {/* Standard Checklists - 2 Column Layout */}
          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              {renderChecklistTable(leftChecklists, "Checklist Part 1")}
            </div>
            <div className="col-lg-6">
              {renderChecklistTable(rightChecklists, "Checklist Part 2")}
            </div>
          </div>

          {!isViewMode && (
            <div className="card border-0 shadow-sm rounded-3 mb-4">
              <div className="card-body p-4">
                <label className="form-label fw-bold text-muted small">Remark (Note)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Additional remarks..."
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                />
              </div>
            </div>
          )}

          {!isViewMode && (
            <div className="d-grid gap-2 d-md-flex justify-content-md-end mb-5">
              <Link href={searchParams.get('returnTo') || "/"} className="btn btn-light border px-4 py-2">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary px-5 py-2 shadow-sm fw-bold">
                <i className="bi bi-check-circle me-2"></i>
                {isEditMode ? 'Update Record' : 'Submit Record'}
              </button>
            </div>
          )}
        </form>
      </div>
      <CameraModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleCameraCapture} />
    </div>
  );
}

export function generateStaticParams() {
  return [];
}
