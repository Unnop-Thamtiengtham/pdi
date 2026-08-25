'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface FieldItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
}

export default function PdfCoordinatePickerPage() {
  const [modelCode, setModelCode] = useState('AION_V');

  // Resolve PDF and image dimensions dynamically based on selected model
  const isUt = modelCode === 'AION_UT';
  const pdfWidth = isUt ? 612.00 : 595.32;
  const pdfHeight = isUt ? 792.00 : 841.92;
  const imgWidth = isUt ? 1545 : 1414;
  const imgHeight = 2000;

  // Display scale
  const displayWidth = 750;
  const displayScale = displayWidth / imgWidth;
  const displayHeight = imgHeight * displayScale;
  const imgRef = useRef<HTMLImageElement>(null);
  const [mousePos, setMousePos] = useState<{ pdfX: number; pdfY: number } | null>(null);
  const [activeFieldIdx, setActiveFieldIdx] = useState(0);
  const [mappedCoords, setMappedCoords] = useState<Record<string, { x: number; y: number }>>({});
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [exportText, setExportText] = useState('');
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [grouped, setGrouped] = useState<Record<string, FieldItem[]>>({});
  const [loading, setLoading] = useState(true);

  // Load checklist fields from database
  useEffect(() => {
    setLoading(true);
    fetch(`/api/pdf-coordinates/fields?modelCode=${modelCode}`)
      .then(res => res.json())
      .then(data => {
        if (data.fields) {
          setFields(data.fields);
          setGrouped(data.grouped || {});
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [modelCode]);

  // Load saved coordinates
  useEffect(() => {
    setMappedCoords({});
    fetch(`/api/pdf-coordinates?modelCode=${modelCode}`)
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          const flat: Record<string, { x: number; y: number }> = {};
          if (data.metadata) {
            Object.entries(data.metadata).forEach(([k, v]: [string, any]) => {
              flat[`meta_${k}`] = v;
            });
          }
          if (data.checklist) {
            Object.entries(data.checklist).forEach(([k, v]: [string, any]) => {
              flat[k] = v;
            });
          }
          if (data.battery) {
            Object.entries(data.battery).forEach(([k, v]: [string, any]) => {
              flat[`bat_${k}`] = v;
            });
          }
          if (data.defects) {
            Object.entries(data.defects).forEach(([k, v]: [string, any]) => {
              flat[`defect_${k}`] = v;
            });
          }
          if (Object.keys(flat).length > 0) {
            setMappedCoords(flat);
            setSaveStatus(`โหลดพิกัดที่บันทึกไว้แล้ว ${Object.keys(flat).length} จุด`);
          }
        }
      })
      .catch(() => {});
  }, [modelCode]);

  const pixelToPdf = useCallback((pixelX: number, pixelY: number) => {
    const origX = pixelX / displayScale;
    const origY = pixelY / displayScale;
    const pdfX = Math.round((origX / imgWidth) * pdfWidth);
    const pdfY = Math.round(pdfHeight - (origY / imgHeight) * pdfHeight);
    return { pdfX, pdfY };
  }, [displayScale, imgWidth, pdfWidth, pdfHeight, imgHeight]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    setMousePos(pixelToPdf(e.clientX - rect.left, e.clientY - rect.top));
  }, [pixelToPdf]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    const img = imgRef.current;
    if (!img || fields.length === 0) return;
    const rect = img.getBoundingClientRect();
    const { pdfX, pdfY } = pixelToPdf(e.clientX - rect.left, e.clientY - rect.top);
    const field = fields[activeFieldIdx];
    if (!field) return;

    setMappedCoords(prev => ({ ...prev, [field.id]: { x: pdfX, y: pdfY } }));
    if (activeFieldIdx < fields.length - 1) {
      setActiveFieldIdx(activeFieldIdx + 1);
    }
  }, [activeFieldIdx, pixelToPdf, fields]);

  const buildOutput = () => {
    const output: any = { metadata: {}, checklist: {}, battery: {}, defects: {} };
    Object.entries(mappedCoords).forEach(([id, coords]) => {
      if (id.startsWith('meta_')) output.metadata[id.replace('meta_', '')] = coords;
      else if (id.startsWith('bat_')) output.battery[id.replace('bat_', '')] = coords;
      else if (id.startsWith('defect_')) output.defects[id.replace('defect_', '')] = coords;
      else output.checklist[id] = coords;
    });
    return output;
  };

  const handleSave = async () => {
    const output = { ...buildOutput(), modelCode };
    setSaveStatus('กำลังบันทึก...');
    try {
      const res = await fetch('/api/pdf-coordinates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(output),
      });
      if (res.ok) {
        setSaveStatus(`✅ บันทึกเรียบร้อย ${mappedCount} จุด — PDF จะใช้พิกัดนี้อัตโนมัติ`);
      } else {
        setSaveStatus('❌ บันทึกไม่สำเร็จ');
      }
    } catch {
      setSaveStatus('❌ เกิดข้อผิดพลาด');
    }
  };

  const handleExport = () => {
    setExportText(JSON.stringify(buildOutput(), null, 2));
  };

  const handleClearOne = (fieldId: string) => {
    setMappedCoords(prev => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handleClearAll = () => {
    setMappedCoords({});
    setActiveFieldIdx(0);
    setSaveStatus('');
  };

  const mappedCount = Object.keys(mappedCoords).length;
  const activeField = fields[activeFieldIdx];

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="flex items-center gap-4 mb-3">
        <h1 className="text-xl font-bold">🎯 PDF Coordinate Picker</h1>
        {/* Model selector */}
        <select
          value={modelCode}
          onChange={e => { setModelCode(e.target.value); setActiveFieldIdx(0); }}
          className="bg-slate-800 border border-slate-600 rounded px-3 py-1 text-sm font-bold text-cyan-400"
        >
          <option value="AION_V">AION V</option>
          <option value="AION_V5">AION V5</option>
          <option value="AION_YP">AION YP</option>
          <option value="AION_YP5">AION YP5</option>
          <option value="AION_ES">AION ES</option>
          <option value="AION_UT">AION UT</option>
          <option value="HYPTEC_HT">Hyptec HT</option>
          <option value="HYPTEC_HT8">Hyptec HT8</option>
        </select>
        <span className="text-xs text-slate-500">
          {fields.length} รายการจากฐานข้อมูล
        </span>
      </div>
      <p className="text-sm text-slate-400 mb-3">
        คลิกที่ตำแหน่งบน PDF เพื่อบันทึกพิกัดของแต่ละรายการตรวจ → กด &quot;💾 บันทึก&quot; เมื่อเสร็จ
      </p>

      {loading ? (
        <div className="text-center py-20 text-slate-400">กำลังโหลดรายการตรวจจากฐานข้อมูล...</div>
      ) : (
        <div className="flex gap-4">
          {/* Left: PDF as Image */}
          <div className="flex-shrink-0 border-2 border-slate-600 rounded overflow-auto bg-white relative" style={{ maxHeight: '88vh' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={
                modelCode === 'AION_UT'
                  ? '/templates/aion-ut-pdi.pdf.png'
                  : modelCode === 'HYPTEC_HT' || modelCode === 'HYPTEC_HT8'
                    ? '/templates/hyptec-ht-pdi.pdf.png'
                    : modelCode === 'AION_YP' || modelCode === 'AION_YP5' || modelCode === 'AION_ES'
                      ? '/templates/aion-yp-pdi.pdf.png'
                      : '/templates/aion-v-pdi.pdf.png'
              }
              alt="PDF Template"
              width={displayWidth}
              height={displayHeight}
              className="cursor-crosshair block"
              style={{ width: displayWidth, height: displayHeight }}
              onMouseMove={handleMouseMove}
              onClick={handleClick}
              draggable={false}
            />
            {/* Render placed markers */}
            {Object.entries(mappedCoords).map(([id, coords]) => {
              const dispX = (coords.x / pdfWidth) * displayWidth;
              const dispY = ((pdfHeight - coords.y) / pdfHeight) * displayHeight;
              return (
                <div
                  key={id}
                  className="absolute pointer-events-none"
                  style={{ left: dispX - 5, top: dispY - 5 }}
                >
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full border border-white shadow-lg" />
                </div>
              );
            })}
          </div>

          {/* Right: Controls */}
          <div className="flex-1 min-w-[300px] max-h-[88vh] overflow-y-auto space-y-2">
            {/* Live Coordinate Display */}
            <div className="bg-slate-800 rounded p-3 sticky top-0 z-10 border border-slate-700">
              <div className="font-mono">
                {mousePos ? (
                  <span className="text-green-400 text-lg font-bold">
                    X = {mousePos.pdfX} &nbsp; Y = {mousePos.pdfY}
                  </span>
                ) : (
                  <span className="text-slate-500 text-sm">เลื่อนเมาส์ไปบน PDF</span>
                )}
              </div>
              <div className="mt-1 text-xs text-amber-400">
                ▶ กำลังจิ้ม: <strong>{activeField?.itemName || 'ครบแล้ว!'}</strong>
                {activeField && (
                  <span className="text-slate-500 ml-1">({activeField.itemCode})</span>
                )}
                <span className="text-slate-500 ml-2">({mappedCount}/{fields.length})</span>
              </div>

              {/* Editable coordinates for the active field */}
              {activeField && (() => {
                const currentCoord = mappedCoords[activeField.id];
                return (
                  <div className="mt-2.5 pt-2 border-t border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-semibold">ปรับพิกัดแมนนวล:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 font-bold">X</span>
                        <input
                          type="number"
                          value={currentCoord ? currentCoord.x : ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setMappedCoords(prev => ({
                              ...prev,
                              [activeField.id]: {
                                x: isNaN(val) ? 0 : val,
                                y: currentCoord ? currentCoord.y : 0
                              }
                            }));
                          }}
                          className="w-16 bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-green-400 font-mono text-center focus:outline-none focus:border-cyan-500"
                          placeholder="—"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 font-bold">Y</span>
                        <input
                          type="number"
                          value={currentCoord ? currentCoord.y : ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setMappedCoords(prev => ({
                              ...prev,
                              [activeField.id]: {
                                x: currentCoord ? currentCoord.x : 0,
                                y: isNaN(val) ? 0 : val
                              }
                            }));
                          }}
                          className="w-16 bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-green-400 font-mono text-center focus:outline-none focus:border-cyan-500"
                          placeholder="—"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="mt-2 text-[10px] text-slate-500 border-t border-slate-700 pt-1">
                💡 <strong>แก้ไขจุด:</strong> คลิกชื่อรายการทางขวา → คลิกบน PDF หรือพิมพ์แก้ตัวเลข X, Y ด้านบน
              </div>
            </div>

            {/* Field Groups from DB */}
            {Object.entries(grouped).map(([groupName, groupFields]) => (
              <div key={groupName} className="bg-slate-800/50 rounded p-2 border border-slate-700/50">
                <h3 className="text-xs font-bold text-cyan-400 mb-1">{groupName}</h3>
                {groupFields.map((field) => {
                  const globalIdx = fields.findIndex(f => f.id === field.id);
                  const coord = mappedCoords[field.id];
                  const isActive = globalIdx === activeFieldIdx;
                  return (
                    <div
                      key={field.id}
                      onClick={() => setActiveFieldIdx(globalIdx)}
                      className={`flex justify-between items-center px-2 py-0.5 rounded text-xs cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                          : coord
                            ? 'bg-green-500/10 text-green-400'
                            : 'text-slate-400 hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="truncate mr-2">
                        {coord ? '✓ ' : ''}{field.itemName}
                        <span className="text-slate-600 ml-1 text-[10px]">{field.itemCode}</span>
                      </span>
                      {coord ? (
                        <span className="flex items-center gap-1 flex-shrink-0">
                          <span className="font-mono text-[10px]">({coord.x}, {coord.y})</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleClearOne(field.id); setActiveFieldIdx(globalIdx); }}
                            className="text-red-400 hover:text-red-300 text-[10px] px-0.5 cursor-pointer"
                            title="ลบจุดนี้"
                          >
                            ✕
                          </button>
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Clear All + Save Buttons */}
            {mappedCount > 0 && (
              <button
                onClick={handleClearAll}
                className="w-full py-1.5 bg-red-900/50 hover:bg-red-800/50 text-red-400 rounded text-xs cursor-pointer border border-red-800/50"
              >
                🗑️ ล้างจุดทั้งหมด ({mappedCount} จุด)
              </button>
            )}
            <button
              onClick={handleSave}
              className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded text-sm cursor-pointer"
            >
              💾 บันทึกพิกัดลงระบบ ({mappedCount} จุด)
            </button>

            {saveStatus && (
              <div className="text-xs text-center py-1 text-slate-300 bg-slate-800 rounded">
                {saveStatus}
              </div>
            )}

            <button
              onClick={handleExport}
              className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs cursor-pointer"
            >
              📋 ดู JSON (สำหรับตรวจสอบ)
            </button>

            {exportText && (
              <pre className="bg-slate-950 text-green-400 p-3 rounded text-[10px] font-mono overflow-auto max-h-[200px] select-all whitespace-pre-wrap">
                {exportText}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
