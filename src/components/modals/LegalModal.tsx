interface Props {
  type: "tos" | "privacy";
  lang: "ru" | "en";
  onClose: () => void;
}

const CONTENT = {
  tos: {
    ru: {
      title: "Условия использования",
      body: [
        { h: "1. Общие положения", p: "Настоящие Условия использования («Условия») регулируют доступ и использование сервиса «Инвестиционный Аналитик» (далее — «Сервис»). Используя Сервис, вы соглашаетесь с настоящими Условиями в полном объёме. Вам должно быть не менее 18 лет. Если вы не согласны с Условиями — прекратите использование Сервиса." },
        { h: "2. Описание сервиса", p: "Сервис предоставляет информационно-аналитические материалы об инвестиционных активах, сформированные с помощью алгоритмов искусственного интеллекта на основе публично доступных данных. Сервис НЕ является профессиональным участником рынка ценных бумаг, брокером, дилером, инвестиционным советником, управляющей компанией или иным лицом, оказывающим услуги на финансовом рынке в соответствии с законодательством РФ и иных юрисдикций." },
        { h: "3. Прямое исключение ИИР (ст. 6.1 Федерального закона от 22.04.1996 № 39-ФЗ)", p: "ВСЕ материалы, аналитика, AI-сигналы, паттерны, оценки и иные выводы, предоставляемые Сервисом, являются результатом автоматизированной обработки публично доступных рыночных данных и носят ИСКЛЮЧИТЕЛЬНО информационно-справочный характер. Они НЕ являются индивидуальными инвестиционными рекомендациями в смысле статьи 6.1 Федерального закона от 22.04.1996 № 39-ФЗ «О рынке ценных бумаг», НЕ являются офертой или приглашением к совершению каких-либо сделок с ценными бумагами, деривативами, валютой или иными финансовыми инструментами. Сервис не имеет и не запрашивает лицензии ЦБ РФ на осуществление деятельности инвестиционного советника." },
        { h: "4. Ограничение ответственности", p: "Сервис предоставляется «как есть» (as is), без каких-либо явных или подразумеваемых гарантий. Мы не гарантируем точность, полноту или актуальность материалов. Сервис, его владельцы и операторы не несут ответственности за любые прямые, косвенные, случайные или штрафные убытки, включая упущенную выгоду и потерю капитала, возникшие в результате использования или невозможности использования Сервиса, в том числе вследствие принятия инвестиционных решений на основе материалов Сервиса. Все инвестиционные решения вы принимаете самостоятельно и на собственный риск." },
        { h: "5. Доступ и учётные записи", p: "Для использования Сервиса требуется создание учётной записи с действующим адресом электронной почты. Вы несёте полную ответственность за безопасность своих учётных данных и за все действия, совершённые с вашей учётной записи. Одна учётная запись — одному пользователю." },
        { h: "6. Оплата, возврат и автопродление", p: "Сервис предоставляет ограниченное количество бесплатных анализов. Дополнительный доступ предоставляется на платной основе путём приобретения кредитов. Стоимость указана на странице оплаты на момент совершения покупки. Кредиты не имеют срока истечения и не возобновляются автоматически. Возврат неиспользованных кредитов возможен в течение 14 дней с момента покупки при условии, что израсходовано не более 20% от приобретённого объёма — обратитесь в поддержку. Возврат не распространяется на уже использованные кредиты (оказанные информационные услуги являются потреблёнными в момент формирования ответа)." },
        { h: "7. Интеллектуальная собственность", p: "Весь контент Сервиса, включая дизайн, программный код и тексты, является интеллектуальной собственностью владельцев Сервиса и защищён законодательством об авторских правах. Разрешается личное некоммерческое использование материалов. Копирование, распространение или коммерческое использование без письменного согласия запрещено." },
        { h: "8. Партнёрские ссылки", p: "Сервис может содержать ссылки на брокеров и иные финансовые платформы. Отдельные ссылки могут быть реферальными, по которым Сервис получает вознаграждение от партнёра. Такие ссылки будут обозначены соответствующей пометкой. Данное вознаграждение не влияет на содержание аналитических материалов." },
        { h: "9. Изменения условий", p: "При обновлении существенных пунктов Условий мы изменяем версию документа и требуем повторного подтверждения от пользователей. Продолжение использования Сервиса после подтверждения новой версии означает согласие с ней." },
        { h: "10. Применимое право", p: "Настоящие Условия регулируются законодательством Российской Федерации. Все споры подлежат рассмотрению в судах по месту нахождения Сервиса. Если какое-либо положение Условий признано недействительным, это не влияет на действительность остальных положений." },
      ],
    },
    en: {
      title: "Terms of Service",
      body: [
        { h: "1. General", p: "These Terms of Service («Terms») govern your access to and use of the Investment Analyst service («Service»). By using the Service, you agree to these Terms in full. You must be at least 18 years old. If you do not agree, please stop using the Service." },
        { h: "2. Service Description", p: "The Service provides informational and analytical materials about investment assets generated by artificial intelligence algorithms based on publicly available data. The Service is NOT a licensed securities dealer, broker, investment advisor, asset manager, or any other financial services provider under any jurisdiction's laws." },
        { h: "3. Not Investment Advice (explicit exclusion)", p: "ALL materials, analysis, AI signals, patterns, valuations, and other outputs provided by the Service are the result of automated processing of publicly available market data and are for INFORMATIONAL PURPOSES ONLY. They do NOT constitute individual investment advice, an offer, a solicitation, or an invitation to buy, sell, or hold any securities, derivatives, currencies, or other financial instruments. Nothing in the Service constitutes personalized financial advice. You must not rely on any Service output as the sole or primary basis for any investment decision." },
        { h: "4. Limitation of Liability", p: "The Service is provided «as is» without warranties of any kind. We make no guarantees regarding accuracy, completeness, or timeliness of materials. The Service, its owners, and operators shall not be liable for any direct, indirect, incidental, or consequential losses — including lost profits and capital losses — arising from the use or inability to use the Service. All investment decisions are made solely at your own risk." },
        { h: "5. Accounts", p: "Using the Service requires creating an account with a valid email address. You are solely responsible for the security of your credentials and all activity under your account. One account per person." },
        { h: "6. Payment, Refunds, and Renewals", p: "The Service provides a limited number of free analyses. Additional access is available by purchasing credits. Pricing is displayed on the payment page at time of purchase. Credits do not expire and do not auto-renew. Refunds on unused credits are available within 14 days of purchase if no more than 20% of the purchased volume has been used — contact support. No refunds are issued for already-used credits (the information service is consumed upon response generation)." },
        { h: "7. Intellectual Property", p: "All Service content including design, code, and text is the intellectual property of the Service owners and is protected by copyright law. Personal non-commercial use is permitted. Copying, distribution, or commercial use without written consent is prohibited." },
        { h: "8. Affiliate Disclosure", p: "The Service may contain links to brokers and financial platforms. Some links may be referral/affiliate links through which the Service receives compensation. Such links will be marked accordingly. This compensation does not influence the content of analytical materials." },
        { h: "9. Changes", p: "When material Terms are updated, we increment the version number and require users to re-confirm. Continued use after confirmation of the new version constitutes acceptance." },
        { h: "10. Governing Law", p: "These Terms are governed by the laws of the Russian Federation for users in Russia, and internationally recognized contract principles for other users. If any provision is found invalid, the remaining provisions remain in full effect." },
      ],
    },
  },
  privacy: {
    ru: {
      title: "Политика конфиденциальности",
      body: [
        { h: "1. Оператор персональных данных (152-ФЗ)", p: "Оператором персональных данных в смысле Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных» является сервис «Инвестиционный Аналитик». Настоящая Политика конфиденциальности описывает состав, порядок и цели обработки персональных данных, а также права субъектов персональных данных." },
        { h: "2. Состав и основания сбора данных", p: "Мы обрабатываем следующие данные с вашего согласия (ст. 9 152-ФЗ): (а) адрес электронной почты — при регистрации; (б) данные об использовании Сервиса — история аналитических запросов, портфель, список наблюдения, инвесторский профиль; (в) технические данные — хэш IP-адреса, тип браузера, время сессии (системные логи). Мы НЕ обрабатываем специальные категории данных (ст. 10 152-ФЗ). Платёжные реквизиты не хранятся нами напрямую — обрабатываются платёжными провайдерами." },
        { h: "3. Цели обработки персональных данных", p: "Персональные данные обрабатываются исключительно в следующих целях: (а) исполнение договора — предоставление функций Сервиса (аналитика, портфель, алерты); (б) защита прав и законных интересов — безопасность, предотвращение мошенничества; (в) исполнение требований законодательства; (г) улучшение качества Сервиса (только в агрегированном обезличенном виде)." },
        { h: "4. Трансграничная передача данных (ст. 12 152-ФЗ)", p: "Данные хранятся в защищённой инфраструктуре Supabase (США/ЕС). Используя Сервис и принимая настоящую Политику, вы даёте согласие на трансграничную передачу ваших персональных данных в Supabase Inc. (США) и Anthropic PBC (США) в объёме, необходимом для предоставления функций Сервиса. Передача в Anthropic ограничена текстом запроса пользователя (тикер/название актива) — персональные идентификаторы не передаются. Мы не продаём и не передаём персональные данные третьим лицам в коммерческих целях." },
        { h: "5. Сроки хранения", p: "Данные учётной записи хранятся до её удаления пользователем. История запросов хранится 90 дней. Кэш анализов хранится 2 часа. Системные логи (хэши IP, user-agent) удаляются автоматически через 30 дней. Записи о согласии с Условиями (user_consents) хранятся бессрочно в целях соблюдения требований законодательства." },
        { h: "6. Права субъекта персональных данных (ст. 14–17 152-ФЗ)", p: "В соответствии с 152-ФЗ и GDPR вы имеете право: (а) получить доступ к своим персональным данным; (б) потребовать исправления неточных данных; (в) потребовать удаления данных («право на забвение») — за исключением данных, необходимых по закону; (г) отозвать согласие на обработку — это влечёт прекращение доступа к Сервису; (д) обратиться с жалобой в Роскомнадзор. Для реализации прав направьте запрос на контактный email, указанный в интерфейсе Сервиса." },
        { h: "7. Cookie и локальное хранилище", p: "Сервис использует localStorage браузера для хранения: настроек интерфейса (язык, тема), кэша результатов анализов (до 2 ч), токена версии согласия (ais_consent_v). Эти данные хранятся исключительно на вашем устройстве, не передаются на серверы и не являются персональными данными. Сервис не использует сторонние трекинговые cookie." },
        { h: "8. Меры безопасности", p: "Данные передаются исключительно по зашифрованному соединению (HTTPS/TLS). Доступ к базе данных защищён Row Level Security (RLS). Пароли не хранятся в открытом виде. IP-адреса хранятся только в хэшированном виде." },
        { h: "9. Изменения политики", p: "При существенном изменении настоящей Политики мы уведомляем пользователей и запрашиваем повторное согласие через ConsentGate. Дата последнего обновления указана внизу документа." },
      ],
    },
    en: {
      title: "Privacy Policy",
      body: [
        { h: "1. Data Controller", p: "The data controller is the Investment Analyst service, operating in accordance with Russia's Federal Law No. 152-FZ «On Personal Data» and applicable GDPR principles. This Policy describes what data we collect, how we use it, and your rights as a data subject." },
        { h: "2. Data Collected and Legal Basis", p: "We process the following data based on your consent: (a) email address — upon registration; (b) usage data — analytical query history, portfolio, watchlist, investor profile; (c) technical data — hashed IP address, browser type, session timestamps (system logs only). We do NOT process special category data. Payment details are not stored by us — handled by payment providers." },
        { h: "3. Purposes of Processing", p: "Personal data is processed solely for: (a) contract performance — providing Service features (analysis, portfolio, alerts); (b) protecting legitimate interests — security, fraud prevention; (c) legal compliance; (d) Service quality improvement (aggregated/anonymized only)." },
        { h: "4. Cross-border Data Transfer", p: "Data is stored in Supabase's infrastructure (USA/EU). By using the Service and accepting this Policy, you consent to cross-border transfer of your personal data to Supabase Inc. (USA) and Anthropic PBC (USA) to the extent necessary to provide the Service. Transfer to Anthropic is limited to the text of your query (ticker/asset name) — no personal identifiers are included. We do not sell or share personal data with third parties for commercial purposes." },
        { h: "5. Retention", p: "Account data is retained until account deletion. Query history is retained for 90 days. Analysis cache for 2 hours. System logs (hashed IPs, user-agents) are auto-deleted after 30 days. Consent records (user_consents) are retained indefinitely for legal compliance purposes." },
        { h: "6. Your Rights", p: "Under applicable law, you have the right to: access your personal data; request correction of inaccurate data; request erasure (right to be forgotten) — except data required by law; withdraw consent (this results in termination of Service access); lodge a complaint with the relevant supervisory authority. To exercise your rights, contact us via the email shown in the Service interface." },
        { h: "7. Cookies and Local Storage", p: "The Service uses browser localStorage to store: interface preferences (language, theme), analysis cache (up to 2h), and consent version token. This data is stored solely on your device, is not transmitted to servers, and does not constitute personal data. The Service does not use third-party tracking cookies." },
        { h: "8. Security Measures", p: "All data is transmitted over encrypted connections (HTTPS/TLS). Database access is protected by Row Level Security (RLS). Passwords are never stored in plain text. IP addresses are stored only in hashed form." },
        { h: "9. Policy Changes", p: "For material changes to this Policy, we notify users and require renewed consent via ConsentGate. The last update date appears at the bottom of this document." },
      ],
    },
  },
};

export function LegalModal({ type, lang, onClose }: Props) {
  const content = CONTENT[type][lang];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "var(--bg2)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 14, width: "100%", maxWidth: 600, maxHeight: "85vh", display: "flex", flexDirection: "column", animation: "fadeUp 0.25s ease both" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid var(--border2)", flexShrink: 0 }}>
          <div>
            <div style={{ color: "#c9a84c", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.2em", marginBottom: 3 }}>
              {lang === "ru" ? "ЮРИДИЧЕСКИЙ ДОКУМЕНТ" : "LEGAL DOCUMENT"}
            </div>
            <div style={{ color: "var(--text)", fontSize: 15, fontWeight: 700 }}>{content.title}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: 20, cursor: "pointer", padding: 4 }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", padding: "20px 22px", flex: 1 }}>
          {content.body.map(({ h, p }) => (
            <div key={h} style={{ marginBottom: 18 }}>
              <div style={{ color: "#c9a84c", fontSize: 11, fontFamily: "monospace", fontWeight: 700, marginBottom: 5 }}>{h}</div>
              <div style={{ color: "#888899", fontSize: 12, lineHeight: 1.7 }}>{p}</div>
            </div>
          ))}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border2)", color: "#444456", fontSize: 10, fontFamily: "monospace" }}>
            {lang === "ru"
              ? `Последнее обновление: апрель 2026 г.`
              : `Last updated: April 2026`}
          </div>
        </div>

        {/* Footer button */}
        <div style={{ padding: "14px 22px", borderTop: "1px solid var(--border2)", flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ width: "100%", background: "linear-gradient(135deg,#c9a84c,#8b6810)", border: "none", borderRadius: 9, padding: "11px", color: "var(--bg)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "monospace" }}
          >
            {lang === "ru" ? "Закрыть" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
