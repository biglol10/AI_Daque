"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, ArrowRight, RotateCcw, Sparkles, Loader2 } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────
interface CharacterResult {
  character_image_url: string;
}

interface MiniInterviewResult {
  summary: string;
  keywords: string[];
}

interface MiniDocumentaryResult {
  character_image_url: string;
  scenes: { image_url: string; description: string }[];
  narration: string;
  audio_url?: string;
}

// ── Constants ──────────────────────────────────────────────────────
const ERA_OPTIONS = ["10대", "20대", "30대", "40대", "50대"] as const;

const QUESTIONS = [
  "그 시절 가장 기억에 남는 순간은 무엇인가요?",
  "그때 가장 행복했던 일은 무엇인가요?",
  "그 시절의 나에게 해주고 싶은 말이 있다면?",
] as const;

const MIN_ANSWER_LENGTH = 20;

// ── Helpers ────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:image/...;base64, prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function tryApi<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/try", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "알 수 없는 오류" }));
    throw new Error(err.error || `요청 실패 (${res.status})`);
  }

  return res.json();
}

// ── Step indicator ─────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  const labels = ["캐릭터", "인터뷰", "결과"];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {labels.map((label, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <div key={step} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-px w-8 ${isDone ? "bg-primary" : "bg-border"}`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step}
              </div>
              <span
                className={`text-xs ${
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Loading overlay ────────────────────────────────────────────────
function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative">
        <Loader2 className="size-12 animate-spin text-primary" />
        <Sparkles className="absolute -top-1 -right-1 size-5 text-yellow-500 animate-pulse" />
      </div>
      <p className="text-base font-medium text-center">{message}</p>
      <p className="text-sm text-muted-foreground">잠시만 기다려주세요...</p>
    </div>
  );
}

// ── Main page component ────────────────────────────────────────────
export default function TryPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Step 1: Character selection (preset or face upload)
  const [charMode, setCharMode] = useState<"preset" | "face">("preset");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [faceFile, setFaceFile] = useState<File | null>(null);
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const [characterResult, setCharacterResult] = useState<CharacterResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset character list
  const [presets] = useState([
    { id: "boy_child", name: "소년", image: "/presets/boy_child.png" },
    { id: "girl_child", name: "소녀", image: "/presets/girl_child.png" },
    { id: "boy_teen", name: "남학생", image: "/presets/boy_teen.png" },
    { id: "girl_teen", name: "여학생", image: "/presets/girl_teen.png" },
    { id: "man_young", name: "청년 남성", image: "/presets/man_young.png" },
    { id: "woman_young", name: "청년 여성", image: "/presets/woman_young.png" },
    { id: "man_middle", name: "중년 남성", image: "/presets/man_middle.png" },
    { id: "woman_middle", name: "중년 여성", image: "/presets/woman_middle.png" },
    { id: "man_senior", name: "할아버지", image: "/presets/man_senior.png" },
    { id: "woman_senior", name: "할머니", image: "/presets/woman_senior.png" },
    { id: "person_glasses", name: "안경 쓴 사람", image: "/presets/person_glasses.png" },
    { id: "person_creative", name: "크리에이터", image: "/presets/person_creative.png" },
  ]);

  // Step 2: Interview
  const [selectedEra, setSelectedEra] = useState<string | null>(null);
  const [birthYear, setBirthYear] = useState("");
  const [answers, setAnswers] = useState(["", "", ""]);

  // Step 3: Documentary result
  const [docResult, setDocResult] = useState<MiniDocumentaryResult | null>(null);

  // ── File handling ──────────────────────────────────────────────
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("파일 크기는 10MB 이하여야 합니다");
      return;
    }
    setFaceFile(file);
    const url = URL.createObjectURL(file);
    setFacePreview(url);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  // ── Step 1: Generate character ─────────────────────────────────
  async function handleGenerateCharacter() {
    if (!faceFile) {
      toast.error("얼굴 사진을 먼저 업로드해주세요");
      return;
    }

    setLoading(true);
    setLoadingMessage("AI가 캐릭터를 그리고 있어요...");

    try {
      const base64 = await fileToBase64(faceFile);
      const result = await tryApi<CharacterResult>("character", {
        face_image_base64: base64,
      });
      setCharacterResult(result);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "캐릭터 생성에 실패했습니다. 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  }

  // ── Step 2: Submit interview + generate documentary ────────────
  function updateAnswer(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function validateInterview(): boolean {
    if (!selectedEra) {
      toast.error("시대를 선택해주세요");
      return false;
    }
    const year = parseInt(birthYear, 10);
    if (isNaN(year) || year < 1940 || year > 2010) {
      toast.error("출생 연도를 올바르게 입력해주세요 (1940-2010)");
      return false;
    }
    for (let i = 0; i < QUESTIONS.length; i++) {
      if (answers[i].trim().length < MIN_ANSWER_LENGTH) {
        toast.error(`질문 ${i + 1}번 답변을 ${MIN_ANSWER_LENGTH}자 이상 입력해주세요`);
        return false;
      }
    }
    return true;
  }

  async function handleSubmitInterview() {
    if (!validateInterview()) return;

    setLoading(true);
    setLoadingMessage("이야기를 정리하고 있어요...");

    try {
      // Step A: mini-interview
      const interviewResult = await tryApi<MiniInterviewResult>("mini-interview", {
        era: selectedEra,
        birth_year: parseInt(birthYear, 10),
        questions: QUESTIONS.map((q, i) => ({ question: q, answer: answers[i] })),
      });

      // Step B: mini-documentary
      setLoadingMessage("이야기를 다큐로 만들고 있어요...");

      const documentary = await tryApi<MiniDocumentaryResult>("mini-documentary", {
        character_image_url: characterResult?.character_image_url,
        era: selectedEra,
        birth_year: parseInt(birthYear, 10),
        interview_summary: interviewResult.summary,
        keywords: interviewResult.keywords,
      });

      setDocResult(documentary);
      setStep(3);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "다큐멘터리 생성에 실패했습니다. 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  }

  // ── Reset ──────────────────────────────────────────────────────
  function resetAll() {
    setStep(1);
    setCharMode("preset");
    setSelectedPreset(null);
    setFaceFile(null);
    setFacePreview(null);
    setCharacterResult(null);
    setSelectedEra(null);
    setBirthYear("");
    setAnswers(["", "", ""]);
    setDocResult(null);
    setLoading(false);
    setLoadingMessage("");
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-center border-b px-4 py-3">
        <h1 className="text-lg font-semibold">AI 셀프 다큐멘터리 체험</h1>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-lg">
          <StepIndicator current={step} />

          {/* ── Step 1: Character Selection ──────────────────── */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-xl">
                  캐릭터를 선택해보세요
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6">
                {loading ? (
                  <LoadingOverlay message={loadingMessage} />
                ) : characterResult ? (
                  /* ── Character generated (from face upload) ── */
                  <>
                    <p className="text-lg font-medium">캐릭터가 완성되었어요!</p>
                    <img
                      src={characterResult.character_image_url}
                      alt="생성된 캐릭터"
                      className="w-[300px] h-[300px] rounded-2xl object-cover ring-2 ring-primary/20"
                    />
                    <Button
                      size="lg"
                      className="w-full text-base"
                      onClick={() => setStep(2)}
                    >
                      다음: 미니 인터뷰
                      <ArrowRight className="size-4 ml-1" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCharacterResult(null);
                        setFaceFile(null);
                        setFacePreview(null);
                        setSelectedPreset(null);
                      }}
                    >
                      다른 캐릭터로 바꾸기
                    </Button>
                  </>
                ) : (
                  <>
                    {/* ── Tab selector ── */}
                    <div className="flex w-full rounded-lg bg-muted p-1">
                      <button
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                          charMode === "preset"
                            ? "bg-background shadow text-foreground"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => setCharMode("preset")}
                      >
                        캐릭터 고르기
                      </button>
                      <button
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                          charMode === "face"
                            ? "bg-background shadow text-foreground"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => setCharMode("face")}
                      >
                        내 얼굴로 만들기
                      </button>
                    </div>

                    {charMode === "preset" ? (
                      /* ── Preset grid ── */
                      <>
                        <p className="text-sm text-muted-foreground text-center">
                          마음에 드는 캐릭터를 골라주세요
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full">
                          {presets.map((preset) => (
                            <button
                              key={preset.id}
                              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all hover:scale-105 ${
                                selectedPreset === preset.id
                                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                  : "border-transparent bg-muted/50 hover:border-muted-foreground/20"
                              }`}
                              onClick={() => setSelectedPreset(preset.id)}
                            >
                              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                                <img
                                  src={preset.image}
                                  alt={preset.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                    (e.target as HTMLImageElement).parentElement!.innerHTML =
                                      `<span class="text-2xl">👤</span>`;
                                  }}
                                />
                              </div>
                              <span className="text-xs font-medium">{preset.name}</span>
                            </button>
                          ))}
                        </div>
                        <Button
                          size="lg"
                          className="w-full text-base"
                          disabled={!selectedPreset}
                          onClick={() => {
                            const preset = presets.find((p) => p.id === selectedPreset);
                            if (preset) {
                              setCharacterResult({ character_image_url: preset.image });
                            }
                          }}
                        >
                          <Sparkles className="size-4 mr-1" />
                          이 캐릭터로 시작하기
                        </Button>
                      </>
                    ) : (
                      /* ── Face upload ── */
                      <>
                        <p className="text-sm text-muted-foreground text-center">
                          얼굴 사진을 올리면 나를 닮은 캐릭터를 AI가 만들어줘요
                        </p>
                        <div
                          className="w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {facePreview ? (
                            <img
                              src={facePreview}
                              alt="업로드한 사진"
                              className="w-40 h-40 rounded-xl object-cover"
                            />
                          ) : (
                            <>
                              <Upload className="size-10 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                클릭하거나 사진을 여기에 드래그해주세요
                              </p>
                            </>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileInputChange}
                          />
                        </div>
                        {faceFile && (
                          <p className="text-xs text-muted-foreground">
                            {faceFile.name} ({(faceFile.size / 1024 / 1024).toFixed(1)}MB)
                          </p>
                        )}
                        <Button
                          size="lg"
                          className="w-full text-base"
                          disabled={!faceFile}
                          onClick={handleGenerateCharacter}
                        >
                          <Sparkles className="size-4 mr-1" />
                          AI 캐릭터 생성 (약 30초)
                        </Button>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Step 2: Mini interview ───────────────────────── */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-xl">
                  3가지 질문에 답해주세요
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {loading ? (
                  <LoadingOverlay message={loadingMessage} />
                ) : (
                  <>
                    {/* Era selector */}
                    <div className="flex flex-col gap-2">
                      <Label>이야기하고 싶은 시절</Label>
                      <div className="flex flex-wrap gap-2">
                        {ERA_OPTIONS.map((era) => (
                          <Button
                            key={era}
                            variant={selectedEra === era ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedEra(era)}
                          >
                            {era}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Birth year */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="birth-year">출생 연도</Label>
                      <Input
                        id="birth-year"
                        type="number"
                        placeholder="예: 1985"
                        min={1940}
                        max={2010}
                        value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value)}
                      />
                    </div>

                    {/* Questions */}
                    {QUESTIONS.map((question, i) => (
                      <div key={i} className="flex flex-col gap-2">
                        <Label>
                          질문 {i + 1}. {question}
                        </Label>
                        <Textarea
                          placeholder={`${MIN_ANSWER_LENGTH}자 이상 입력해주세요`}
                          value={answers[i]}
                          onChange={(e) => updateAnswer(i, e.target.value)}
                          rows={3}
                        />
                        <p
                          className={`text-xs ${
                            answers[i].trim().length >= MIN_ANSWER_LENGTH
                              ? "text-muted-foreground"
                              : "text-destructive"
                          }`}
                        >
                          {answers[i].trim().length}/{MIN_ANSWER_LENGTH}자
                        </p>
                      </div>
                    ))}

                    <Button
                      size="lg"
                      className="w-full text-base"
                      onClick={handleSubmitInterview}
                    >
                      <Sparkles className="size-4 mr-1" />
                      미니 다큐 만들기
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setStep(1)}
                    >
                      이전 단계로
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Step 3: Mini documentary result ──────────────── */}
          {step === 3 && docResult && (
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-xl">
                    미니 다큐멘터리 완성!
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                  {/* Character image */}
                  <img
                    src={docResult.character_image_url}
                    alt="캐릭터"
                    className="w-[300px] h-[300px] rounded-2xl object-cover ring-2 ring-primary/20"
                  />

                  {/* Background scenes */}
                  {docResult.scenes.length > 0 && (
                    <div className="w-full">
                      <p className="text-sm font-medium mb-3">스토리보드</p>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {docResult.scenes.map((scene, i) => (
                          <div
                            key={i}
                            className="flex-shrink-0 w-56 rounded-xl overflow-hidden ring-1 ring-foreground/10"
                          >
                            <img
                              src={scene.image_url}
                              alt={`장면 ${i + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            <p className="p-2 text-xs text-muted-foreground">
                              {scene.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Narration */}
                  <div className="w-full rounded-xl bg-muted/50 border p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      나레이션
                    </p>
                    <p className="text-sm leading-relaxed italic whitespace-pre-wrap">
                      &ldquo;{docResult.narration}&rdquo;
                    </p>
                  </div>

                  {/* Audio player */}
                  {docResult.audio_url && (
                    <div className="w-full">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        샘플 나레이션 음성
                      </p>
                      <audio controls className="w-full" src={docResult.audio_url}>
                        브라우저가 오디오를 지원하지 않습니다.
                      </audio>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="flex flex-col items-center gap-3 py-6">
                  <p className="text-base font-semibold text-center">
                    전체 다큐멘터리를 만들어보세요
                  </p>
                  <p className="text-sm text-muted-foreground text-center">
                    가입하면 풀 인터뷰 + 내 목소리 나레이션 + 고화질 영상을 만들 수
                    있어요
                  </p>
                  <Button
                    size="lg"
                    className="w-full text-base mt-2"
                    onClick={() => router.push("/login")}
                  >
                    전체 다큐멘터리 만들기
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={resetAll}
                  >
                    <RotateCcw className="size-4 mr-1" />
                    다시 만들기
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
