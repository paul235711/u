"use client";

import { ChangeEvent, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { MediaDisplay } from "../MediaDisplay";
import type { EquipmentWizardMediaState, EquipmentWizardMode, EquipmentType } from "./EquipmentWizardDialog";

export interface StepMediaProps {
  value: EquipmentWizardMediaState;
  onChange: (next: EquipmentWizardMediaState) => void;
  mode: EquipmentWizardMode;
  elementId?: string;
  elementType?: EquipmentType;
}

export function StepMedia({ value, onChange, mode, elementId, elementType }: StepMediaProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    onChange({ newFiles: [...value.newFiles, ...files] });
  };

  const handleCameraChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    // En pratique la caméra renvoie un seul fichier, mais on gère la liste pour rester générique
    onChange({ newFiles: [...value.newFiles, ...files] });
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleClear = () => {
    onChange({ newFiles: [] });
  };

  const hasFiles = value.newFiles.length > 0;

  return (
    <div className="space-y-4">
      {mode === "edit" && elementId && elementType && (
        <div className="space-y-2">
          <Label className="text-sm">Médias existants</Label>
          <MediaDisplay
            elementId={elementId}
            elementType={elementType}
            allowDelete
          />
        </div>
      )}

      <div>
        <Label htmlFor="wizard-files">Photos / Documents</Label>
        <div className="mt-2 space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Importer
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCameraClick}
            >
              <Camera className="h-4 w-4 mr-1" />
              Prendre une photo
            </Button>
          </div>

          <input
            ref={fileInputRef}
            id="wizard-files"
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileChange}
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCameraChange}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Ajoutez des photos ou documents de référence pour aider à identifier cet équipement.
          Sur mobile, vous pouvez aussi utiliser «&nbsp;Prendre une photo&nbsp;» pour capturer directement depuis la caméra.
        </p>
      </div>

      {hasFiles && (
        <div className="mt-2 space-y-1 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>
              {value.newFiles.length} fichier{value.newFiles.length > 1 ? "s" : ""} sélectionné
              {value.newFiles.length > 1 ? "s" : ""}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
              Vider
            </Button>
          </div>
          <ul className="list-inside list-disc">
            {value.newFiles.map((file) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
