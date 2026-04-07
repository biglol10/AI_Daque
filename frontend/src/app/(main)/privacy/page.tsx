export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">개인정보처리방침</h1>
      <p className="text-sm text-muted-foreground mb-8">
        시행일: 2026년 4월 1일 | 최종 수정: 2026년 3월 31일
      </p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
        <p>
          AI 셀프 다큐멘터리(이하 &quot;서비스&quot;)는 이용자의 개인정보를 소중히 여기며,
          「개인정보 보호법」 등 관련 법령을 준수합니다. 본 개인정보처리방침은 서비스가
          수집하는 개인정보의 항목, 이용 목적, 보관 기간, 이용자의 권리를 안내합니다.
        </p>

        <section>
          <h2 className="text-lg font-semibold mb-3">1. 수집하는 개인정보 항목</h2>

          <h3 className="text-base font-medium mt-4 mb-2">1.1 필수 수집 항목</h3>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">항목</th>
                <th className="border p-2 text-left">수집 목적</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border p-2">이메일 주소</td><td className="border p-2">회원 가입, 로그인, 서비스 안내</td></tr>
              <tr><td className="border p-2">비밀번호 (암호화 저장)</td><td className="border p-2">계정 보안</td></tr>
              <tr><td className="border p-2">이름 (표시명)</td><td className="border p-2">서비스 내 표시, 다큐멘터리 제작</td></tr>
              <tr><td className="border p-2">생년</td><td className="border p-2">인생 시기 계산, 시대배경 자동 생성</td></tr>
              <tr><td className="border p-2">성별</td><td className="border p-2">AI 캐릭터 생성 참고</td></tr>
            </tbody>
          </table>

          <h3 className="text-base font-medium mt-4 mb-2">1.2 서비스 이용 시 수집 항목</h3>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">항목</th>
                <th className="border p-2 text-left">수집 목적</th>
                <th className="border p-2 text-left">민감 정보 여부</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2 font-medium">얼굴 사진</td>
                <td className="border p-2">AI 카툰 캐릭터 생성</td>
                <td className="border p-2">생체인식정보 (민감정보)</td>
              </tr>
              <tr>
                <td className="border p-2 font-medium">음성 녹음</td>
                <td className="border p-2">보이스 클로닝 TTS 나레이션</td>
                <td className="border p-2">생체인식정보 (민감정보)</td>
              </tr>
              <tr>
                <td className="border p-2 font-medium">인생 이야기 (텍스트)</td>
                <td className="border p-2">다큐멘터리 서사 구성</td>
                <td className="border p-2">개인 신상정보 포함 가능</td>
              </tr>
              <tr>
                <td className="border p-2">업로드 사진</td>
                <td className="border p-2">다큐멘터리 장면 구성</td>
                <td className="border p-2">-</td>
              </tr>
            </tbody>
          </table>

          <h3 className="text-base font-medium mt-4 mb-2">1.3 자동 수집 항목</h3>
          <p className="text-sm">
            접속 IP, 브라우저 정보, 접속 일시, 서비스 이용 기록이 자동으로 수집됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">2. 개인정보의 이용 목적</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>AI 다큐멘터리 영상 제작 (핵심 서비스 제공)</li>
            <li>AI 캐릭터 생성을 위한 얼굴 특징 분석</li>
            <li>보이스 클로닝을 통한 개인화 나레이션 생성</li>
            <li>시대배경 자동 생성을 위한 생년 기반 연도 계산</li>
            <li>서비스 개선 및 품질 향상</li>
            <li>고객 문의 응대</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">3. 개인정보의 보관 및 파기</h2>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">항목</th>
                <th className="border p-2 text-left">보관 기간</th>
                <th className="border p-2 text-left">파기 방법</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">계정 정보 (이메일, 이름)</td>
                <td className="border p-2">회원 탈퇴 시까지</td>
                <td className="border p-2">탈퇴 즉시 삭제</td>
              </tr>
              <tr>
                <td className="border p-2">얼굴 사진</td>
                <td className="border p-2">캐릭터 생성 완료 후 즉시 삭제 가능</td>
                <td className="border p-2">사용자 요청 시 즉시 삭제, 탈퇴 시 자동 삭제</td>
              </tr>
              <tr>
                <td className="border p-2">음성 녹음 원본</td>
                <td className="border p-2">보이스 클로닝 완료 후 즉시 삭제 가능</td>
                <td className="border p-2">사용자 요청 시 즉시 삭제, 탈퇴 시 자동 삭제</td>
              </tr>
              <tr>
                <td className="border p-2">인터뷰 내용 (텍스트)</td>
                <td className="border p-2">프로젝트 삭제 시까지</td>
                <td className="border p-2">프로젝트 삭제 시 연관 데이터 전체 삭제</td>
              </tr>
              <tr>
                <td className="border p-2">생성된 영상</td>
                <td className="border p-2">프로젝트 삭제 시까지</td>
                <td className="border p-2">프로젝트 삭제 시 Storage에서 삭제</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">4. 민감정보 처리 특칙</h2>
          <p className="text-sm mb-3">
            본 서비스는 얼굴 사진과 음성 녹음을 수집하며, 이는 「개인정보 보호법」상
            민감정보(생체인식정보)에 해당할 수 있습니다.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              <strong>얼굴 사진</strong>: AI 캐릭터 생성 목적으로만 사용됩니다.
              얼굴 인식/식별 목적으로 사용하지 않으며, 원본 사진은 사용자 요청 시 즉시 삭제합니다.
            </li>
            <li>
              <strong>음성 녹음</strong>: 보이스 클로닝 목적으로만 사용됩니다.
              별도의 동의 절차를 거치며, 본인 음성임을 확인하는 동의서를 수집합니다.
              타인의 음성을 사용하는 것은 금지됩니다.
            </li>
            <li>
              <strong>인생 이야기</strong>: AI 모델 학습에 사용하지 않습니다.
              오직 해당 사용자의 다큐멘터리 제작에만 활용됩니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">5. 개인정보의 제3자 제공</h2>
          <p className="text-sm mb-3">
            서비스는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
            다만, 서비스 제공을 위해 아래 외부 서비스를 이용합니다.
          </p>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">위탁 업체</th>
                <th className="border p-2 text-left">위탁 업무</th>
                <th className="border p-2 text-left">처리하는 정보</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">OpenAI (미국)</td>
                <td className="border p-2">AI 인터뷰 대화, 이미지 생성</td>
                <td className="border p-2">인터뷰 텍스트, 얼굴 특징 설명 (원본 사진 아님)</td>
              </tr>
              <tr>
                <td className="border p-2">ElevenLabs (미국)</td>
                <td className="border p-2">음성 합성 (TTS), 보이스 클로닝</td>
                <td className="border p-2">나레이션 텍스트, 음성 녹음 (클로닝 시)</td>
              </tr>
              <tr>
                <td className="border p-2">Supabase (미국/싱가포르)</td>
                <td className="border p-2">데이터 저장, 인증</td>
                <td className="border p-2">계정 정보, 프로젝트 데이터, 파일</td>
              </tr>
            </tbody>
          </table>
          <p className="text-sm mt-2">
            각 외부 서비스의 데이터 처리 방침은 해당 서비스의 개인정보처리방침을 참고하시기 바랍니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">6. AI 처리에 관한 고지</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>본 서비스는 AI 기술을 활용하여 다큐멘터리 영상을 생성합니다.</li>
            <li>AI가 생성한 캐릭터, 배경 이미지, 나레이션은 실제와 다를 수 있습니다.</li>
            <li>생성된 콘텐츠에는 &quot;AI 생성 콘텐츠&quot; 표시가 포함됩니다.</li>
            <li>이용자의 인터뷰 데이터는 AI 모델 훈련(학습)에 사용되지 않습니다.</li>
            <li>AI 처리 과정에서 가드레일(안전장치)이 적용되어 민감한 내용은 자동 필터링됩니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">7. 이용자의 권리</h2>
          <p className="text-sm mb-3">
            이용자는 언제든지 다음 권리를 행사할 수 있습니다.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li><strong>열람권</strong>: 수집된 개인정보의 열람을 요청할 수 있습니다.</li>
            <li><strong>정정권</strong>: 부정확한 개인정보의 정정을 요청할 수 있습니다.</li>
            <li><strong>삭제권</strong>: 개인정보의 삭제를 요청할 수 있습니다. 프로젝트 삭제 시 관련 데이터가 모두 삭제됩니다.</li>
            <li><strong>처리정지권</strong>: 개인정보 처리의 정지를 요청할 수 있습니다.</li>
            <li><strong>동의 철회권</strong>: 보이스 클로닝 등 별도 동의 사항을 언제든지 철회할 수 있습니다.</li>
            <li><strong>탈퇴권</strong>: 회원 탈퇴 시 모든 개인정보가 즉시 삭제됩니다.</li>
          </ul>
          <p className="text-sm mt-2">
            권리 행사는 서비스 내 설정 페이지에서 직접 하거나, 아래 연락처로 요청할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">8. 개인정보 보호 조치</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>모든 통신은 HTTPS(TLS 1.2 이상)로 암호화됩니다.</li>
            <li>비밀번호는 단방향 암호화(bcrypt)로 저장됩니다.</li>
            <li>얼굴 사진, 음성 파일은 접근 권한이 있는 본인만 열람 가능합니다 (RLS 적용).</li>
            <li>외부 API 전송 시 최소한의 정보만 전달합니다 (얼굴 원본이 아닌 특징 설명만 전송).</li>
            <li>PII(개인식별정보) 자동 감지 시스템이 인터뷰 내용에서 전화번호, 주소 등을 자동 마스킹합니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">9. 개인정보 보호책임자</h2>
          <table className="w-full text-sm border">
            <tbody>
              <tr><td className="border p-2 font-medium w-32">담당자</td><td className="border p-2">[이름]</td></tr>
              <tr><td className="border p-2 font-medium">이메일</td><td className="border p-2">[email@example.com]</td></tr>
            </tbody>
          </table>
          <p className="text-sm mt-3">
            개인정보 침해에 대한 피해 구제는 개인정보분쟁조정위원회(www.kopico.go.kr),
            한국인터넷진흥원 개인정보침해신고센터(privacy.kisa.or.kr)에 문의하실 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">10. 방침 변경</h2>
          <p className="text-sm">
            본 방침이 변경되는 경우 시행일 7일 전부터 서비스 내 공지합니다.
            중요한 변경 사항은 이메일로 개별 안내합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
