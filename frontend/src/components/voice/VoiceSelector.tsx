// Design Ref: §5.2 — VoiceSelector (샘플 보이스 / 클로닝 탭 전환)
"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VoiceSamplePlayer } from "@/components/voice/VoiceSamplePlayer";
import { VoiceCloneUploader } from "@/components/voice/VoiceCloneUploader";
import { VoiceConsentDialog } from "@/components/voice/VoiceConsentDialog";
import { useAuthStore } from "@/stores/authStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

interface VoiceSelectorProps {
  projectId: string;
  onVoiceSelected: (voiceId: string, type: "sample" | "cloned") => void;
}

export function VoiceSelector({
  projectId,
  onVoiceSelected,
}: VoiceSelectorProps) {
  const { user } = useAuthStore();
  const [consented, setConsented] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"sample" | "cloned">("sample");

  const handleSampleSelect = useCallback(
    (voiceId: string) => {
      setSelectedVoiceId(voiceId);
      setSelectedType("sample");
      onVoiceSelected(voiceId, "sample");
    },
    [onVoiceSelected]
  );

  const handleCloneComplete = useCallback(
    (voiceId: string) => {
      setSelectedVoiceId(voiceId);
      setSelectedType("cloned");
      onVoiceSelected(voiceId, "cloned");
    },
    [onVoiceSelected]
  );

  const handleConsentGiven = useCallback(() => {
    setConsented(true);
  }, []);

  return (
    <Tabs defaultValue="sample" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="sample">샘플 보이스</TabsTrigger>
        <TabsTrigger value="clone">내 목소리 클로닝</TabsTrigger>
      </TabsList>

      <TabsContent value="sample">
        <VoiceSamplePlayer
          onSelect={handleSampleSelect}
          selectedVoiceId={selectedType === "sample" ? selectedVoiceId : null}
        />
      </TabsContent>

      <TabsContent value="clone">
        {consented ? (
          <VoiceCloneUploader
            userId={user?.id ?? "anonymous"}
            projectId={projectId}
            onCloneComplete={handleCloneComplete}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5" />
                동의 필요
              </CardTitle>
              <CardDescription>
                내 목소리를 클로닝하려면 먼저 동의 절차를 완료해주세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VoiceConsentDialog
                projectId={projectId}
                onConsentGiven={handleConsentGiven}
              />
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
