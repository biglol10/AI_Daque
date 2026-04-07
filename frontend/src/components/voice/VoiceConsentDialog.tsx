// Design Ref: §14.3 — VoiceConsentDialog (보이스 클로닝 동의 다이얼로그)
"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

interface VoiceConsentDialogProps {
  projectId: string;
  onConsentGiven: () => void;
}

export function VoiceConsentDialog({
  projectId,
  onConsentGiven,
}: VoiceConsentDialogProps) {
  const [open, setOpen] = useState(false);
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allConsented = consent1 && consent2;

  const handleSubmit = useCallback(async () => {
    if (!allConsented) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "consent",
          project_id: projectId,
          consent_given: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || "동의 기록에 실패했습니다.");
      }

      toast.success("동의가 기록되었습니다.");
      setOpen(false);
      onConsentGiven();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "동의 기록에 실패했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  }, [allConsented, projectId, onConsentGiven]);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setConsent1(false);
      setConsent2(false);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" className="w-full">
            <ShieldCheck className="size-4 mr-2" />
            보이스 클로닝 동의하기
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>보이스 클로닝 동의</DialogTitle>
          <DialogDescription>
            AI 보이스 클로닝을 사용하려면 아래 항목에 동의해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={consent1}
              onCheckedChange={(checked) =>
                setConsent1(checked === true)
              }
              id="consent-1"
            />
            <Label htmlFor="consent-1" className="text-sm leading-relaxed cursor-pointer">
              본인의 음성을 AI 보이스 클로닝에 사용하는 것에 동의합니다.
              클로닝된 보이스는 본 프로젝트의 내레이션 생성 목적으로만
              사용됩니다.
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              checked={consent2}
              onCheckedChange={(checked) =>
                setConsent2(checked === true)
              }
              id="consent-2"
            />
            <Label htmlFor="consent-2" className="text-sm leading-relaxed cursor-pointer">
              이 음성은 본인의 것이며, 타인의 음성이 아님을 확인합니다.
              타인의 음성을 무단으로 사용하는 것은 법적 책임이 따를 수
              있습니다.
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!allConsented || submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
            ) : (
              <ShieldCheck className="size-4 mr-2" />
            )}
            동의합니다
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
