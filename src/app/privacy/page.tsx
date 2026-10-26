import type { Metadata } from "next";

import {
  addressLines,
  appUrl,
  governingLaw,
  legalEntity,
  privacyEmail,
  registeredAddress,
  shortName,
  uen,
} from "@/features/legal/company";
import { fontClassName } from "@/lib/fonts";
import {
  Callout,
  ContactBlock,
  DefinitionTable,
  LegalShell,
  Section,
} from "@/features/legal/legal-shell";
import { getMetadataBase, siteName } from "@/lib/site";

const pageTitle = "Privacy Policy";
const pageDescription =
  "How Dataverse collects, uses, stores, and protects personal data — including what we take from Google sign-in, what leaves your network, and what never does.";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `${pageTitle} | ${siteName}`,
    description: pageDescription,
    url: "/privacy",
    siteName,
    locale: "en_US",
    type: "website",
  },
  robots: { index: true, follow: true },
};

const sections = [
  { id: "who-we-are", label: "Who we are" },
  { id: "scope", label: "Scope" },
  { id: "what-we-collect", label: "Information we collect" },
  { id: "how-we-use", label: "How we use information" },
  { id: "google", label: "Google sign-in" },
  { id: "connectors", label: "Connected accounts" },
  { id: "your-data", label: "Your databases and content" },
  { id: "ai-providers", label: "AI model providers" },
  { id: "cookies", label: "Cookies" },
  { id: "sharing", label: "Sharing and disclosure" },
  { id: "security", label: "Security" },
  { id: "retention", label: "Retention" },
  { id: "transfers", label: "International transfers" },
  { id: "rights", label: "Your rights" },
  { id: "children", label: "Children" },
  { id: "changes", label: "Changes to this policy" },
  { id: "contact", label: "Contact us" },
] as const;

export default function PrivacyPolicy() {
  return (
    <LegalShell
      current="privacy"
      eyebrow="Legal"
      title={pageTitle}
      fontClassName={fontClassName}
      sections={sections}
      lede={
        <p>
          Dataverse is an enterprise data agent. It sits next to databases that hold some of
          the most sensitive information an organisation owns, so the way we handle data is
          part of the product, not an afterthought. This policy explains{" "}
          <strong>exactly what we collect, why, where it goes, and what never leaves your
          environment</strong> — in specifics rather than generalities.
        </p>
      }
    >
      <Section id="who-we-are" heading="1. Who we are">
        <p>
          Dataverse (“<strong>Dataverse</strong>”, “<strong>we</strong>”, “
          <strong>us</strong>”) is a product of {legalEntity} ({shortName}), a company
          incorporated in Singapore under UEN {uen}, with its registered office at{" "}
          {registeredAddress}. For the personal data described in this policy, {shortName} acts
          as the <strong>data controller</strong> in respect of accounts we create and operate
          on our hosted service at <a href={appUrl}>{appUrl.replace("https://", "")}</a>.
        </p>
        <p>
          Where you use Dataverse under a written agreement with your employer — that is, your
          organisation is the customer and you are one of its users — your organisation is the
          controller of the content it puts into the service, and {shortName} acts as its{" "}
          <strong>processor</strong>. In that case your organisation’s own privacy notice
          governs that content, and this policy tells you what we do underneath it.
        </p>
        <p>
          If you run Dataverse on your own infrastructure — in your VPC, on-premises, or
          air-gapped — we operate nothing and receive nothing. This policy then describes only
          the software’s behaviour, and your organisation is the sole controller.
        </p>
      </Section>

      <Section id="scope" heading="2. Scope">
        <p>This policy covers:</p>
        <ul>
          <li>
            the marketing website at <a href="/">dataverse.alphaleap.co</a>;
          </li>
          <li>
            the hosted Dataverse application at{" "}
            <a href={appUrl}>{appUrl.replace("https://", "")}</a>, including the closed beta;
            and
          </li>
          <li>
            any email or support correspondence you have with us about either.
          </li>
        </ul>
        <p>
          It does not cover third-party services you choose to connect to Dataverse — your
          own databases, your model provider, or accounts you link through Connectors. Those
          are governed by their own terms and privacy notices, and we describe our role at the
          boundary in sections 6 to 8.
        </p>
      </Section>

      <Section id="what-we-collect" heading="3. Information we collect">
        <p>
          We collect only what the service needs in order to function. There is no analytics
          SDK, no advertising pixel, and no third-party tracker on either the marketing site or
          the application.
        </p>

        <h3>3.1 Information you give us</h3>
        <DefinitionTable
          columns={["Category", "What it consists of"]}
          rows={[
            [
              "Account",
              "Your email address, your name, and — for password accounts — a salted PBKDF2-SHA256 hash of your password. We never store, log, or transmit your password in plain text, and we cannot recover it.",
            ],
            [
              "Workspace",
              "The team you belong to, its name, its verified email domains, and your role within it (member, admin, or superadmin).",
            ],
            [
              "Content you create",
              "Questions you ask, the SQL Dataverse generates in response, conversation history, saved dashboards, business rules, glossary terms, skills, and any documents or files you upload to a knowledge library or workspace.",
            ],
            [
              "Data source configuration",
              "The name, dialect, and connection details of each database you register. Credentials are handled as described in section 7.",
            ],
            [
              "Support correspondence",
              "Anything you send us by email or through the in-app issue reporter, including attachments and screenshots.",
            ],
          ]}
        />

        <h3>3.2 Information we generate or receive automatically</h3>
        <DefinitionTable
          columns={["Category", "What it consists of"]}
          rows={[
            [
              "Session records",
              "An opaque session identifier, its expiry, and the time of your last request. Session tokens themselves are stored only as one-way hashes, so a copy of our database does not yield a usable token.",
            ],
            [
              "Identity provider claims",
              "If you sign in with Google or another identity provider, the claims described in section 5.",
            ],
            [
              "Schema metadata",
              "Table names, column names, data types, relationships, descriptions, and — where you enable value indexing — representative sample values drawn from your databases, so that questions can be matched to the right tables.",
            ],
            [
              "Usage metering",
              "Counts of model input and output tokens per request, used to show your team its consumption and to size the service. This records how much was processed, not what was in it.",
            ],
            [
              "Server logs",
              "Standard web-server records: IP address, user agent, request path, response status, and timestamp. Held in our cloud provider’s logging service.",
            ],
          ]}
        />
        <p>
          We do not collect special-category data (health, biometrics, political opinions, and
          similar) about you, and you should not put such data into support correspondence.
          Whether it appears in the databases you connect is a matter for your organisation to
          decide and govern.
        </p>
      </Section>

      <Section id="how-we-use" heading="4. How we use information">
        <p>We use personal data for these purposes, and no others:</p>
        <DefinitionTable
          columns={["Purpose", "Legal basis (UK/EU GDPR)"]}
          rows={[
            [
              "Providing the service",
              "Performance of a contract with you, or the legitimate interests of your organisation in providing you with tools of work.",
            ],
            [
              "Authenticating you and keeping accounts secure",
              "Performance of a contract, and our legitimate interest in preventing unauthorised access.",
            ],
            [
              "Administering the closed beta — deciding who may create an account, issuing credentials, and revoking access",
              "Our legitimate interest in running a controlled release, and your consent where you asked to take part.",
            ],
            [
              "Diagnosing faults, and improving reliability and quality",
              "Our legitimate interest in operating a service that works.",
            ],
            [
              "Responding to your support requests",
              "Performance of a contract, and our legitimate interest in supporting our users.",
            ],
            [
              "Meeting legal, tax, and regulatory obligations",
              "Compliance with a legal obligation.",
            ],
          ]}
        />
        <Callout>
          <p>
            <strong>We do not train models on your data.</strong> Your questions, your SQL, your
            schema, your documents, and your query results are never used to train, fine-tune,
            or otherwise improve any machine-learning model, ours or anyone else’s. We do not
            sell personal data, we do not share it for cross-context behavioural advertising,
            and we run no advertising on any Dataverse surface.
          </p>
        </Callout>
      </Section>

      <Section id="google" heading="5. Google sign-in">
        <p>
          You can sign in to Dataverse with a Google account. When you do, we ask Google for
          three scopes and no others: <code>openid</code>, <code>userinfo.email</code>, and{" "}
          <code>userinfo.profile</code>. From the response we read and store exactly four
          values:
        </p>
        <ul>
          <li>
            your Google account’s stable identifier (the OpenID Connect <code>sub</code> claim),
            so we can recognise you on your next sign-in;
          </li>
          <li>your email address;</li>
          <li>whether Google has verified that address; and</li>
          <li>your display name.</li>
        </ul>
        <p>
          We do not request offline access and we do not receive or store a Google refresh
          token. We have no ability to read your Gmail, your Drive, your Calendar, or your
          contacts through sign-in. Signing in with Google grants Dataverse nothing beyond
          confirming who you are.
        </p>
        <Callout>
          <p>
            <strong>Limited Use commitment.</strong> Dataverse’s use and transfer of information
            received from Google APIs adheres to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google API Services User Data Policy
            </a>
            , including its Limited Use requirements. We use Google user data only to provide
            and improve the features you have asked for, we do not transfer it except as
            necessary to provide those features or as required by law, we do not use it for
            advertising, and we do not allow humans to read it except with your explicit
            consent, for security purposes, to comply with applicable law, or where the data is
            aggregated and anonymised.
          </p>
        </Callout>
        <p>
          You can revoke Dataverse’s access at any time from your{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google account permissions page
          </a>
          . Doing so ends your ability to sign in with Google; it does not by itself delete
          your Dataverse account, which you can request under section 14.
        </p>
      </Section>

      <Section id="connectors" heading="6. Connected accounts (Connectors)">
        <p>
          Separately from sign-in, Dataverse can connect to third-party accounts you already
          use — Gmail, Google Drive, Google Calendar, Slack, Notion, GitHub, Atlassian, Linear,
          Asana, Outlook, Dropbox, Box, HubSpot, and others — so the agent can use them as
          tools while answering your questions. This is always an explicit, per-person choice.
        </p>
        <ul>
          <li>
            <strong>You authorise each one yourself.</strong> Nobody, including a team admin or
            a Dataverse superadmin, can connect an account on your behalf. A colleague
            connecting Slack for the team does not connect your Slack.
          </li>
          <li>
            <strong>We record what the vendor actually granted.</strong> Tools appear to the
            agent only where the scopes you approved permit them. Reducing the scopes reduces
            the tools.
          </li>
          <li>
            <strong>Access tokens are encrypted at rest</strong> in a dedicated secret vault and
            are never returned by any API response or written to browser storage.
          </li>
          <li>
            <strong>Outward-facing actions require a second confirmation.</strong> Sending an
            email, posting a message, creating a calendar event, or filing an issue returns a
            preview and a single-use token first, and executes only when you confirm. An
            irreversible action is never one accidental tool call.
          </li>
          <li>
            <strong>You can disconnect at any time</strong> from Integration → Connectors, which
            deletes the stored tokens.
          </li>
        </ul>
        <p>
          Data retrieved from a connected account is used to answer the request that retrieved
          it and is held in that conversation’s history. It is not copied into any other
          user’s workspace.
        </p>
      </Section>

      <Section id="your-data" heading="7. Your databases and content">
        <p>
          This is the section most people are actually asking about, so it is the most
          specific.
        </p>

        <h3>7.1 Database credentials</h3>
        <p>
          Credentials for a registered data source are encrypted with a key held by the
          deployment and stored in a secret vault; the catalogue entry holds only an opaque
          reference to that vault entry, never the credential itself. Credentials are never
          included in any API response and never reach your browser. For interactive
          connections that require step-up authentication — a Snowflake session with MFA, for
          example — the live connection is held in server memory for the duration of your
          session and is never written to disk.
        </p>

        <h3>7.2 Query execution</h3>
        <p>
          Generated SQL runs against your database, over the connection you configured. Result
          rows are returned to your browser for display and retained with the conversation so
          you can revisit an answer. Dataverse does not bulk-export, mirror, or warehouse your
          tables.
        </p>

        <h3>7.3 What is indexed</h3>
        <p>
          To match a question to the right tables, Dataverse builds a searchable index of your
          schema: table and column names, types, relationships, and descriptions. If your team
          enables value indexing, that index also includes representative values sampled from
          your columns, which is what lets the agent resolve a phrase like “Beauty” to the
          right category code. Because those samples are drawn from your data, treat value
          indexing as a decision about data movement, not a performance setting — it is off
          unless your team turns it on, and section 8 explains where the index is computed.
        </p>

        <h3>7.4 Access control</h3>
        <p>
          Within a workspace, access is governed by roles, per-database grants, and table- and
          column-level policies set by your admins. Dataverse enforces those policies on every
          query; it does not give a user a route to data their role does not permit.
        </p>
      </Section>

      <Section id="ai-providers" heading="8. AI model providers">
        <p>
          Answering a question requires sending a prompt to a language model. That prompt
          contains your question and the schema context needed to answer it — table and column
          names, descriptions, relationships, and, where value indexing is enabled, sample
          values. Depending on the step, it may also contain the SQL produced and any error the
          database returned, so the agent can repair it.
        </p>
        <p>
          <strong>Where that prompt goes is your team’s choice, not ours.</strong> A team admin
          selects the model provider in Integration → Models. If your team selects a hosted
          provider — OpenAI, Anthropic, Google, or any of the other supported services — the
          prompt is transmitted to that provider under your team’s own API key and is subject to
          that provider’s terms and retention policy. If your team selects a locally hosted or
          self-managed model, the prompt never leaves your deployment.
        </p>
        <p>
          Provider API keys your team supplies are encrypted at rest and are never returned by
          any API response or stored in your browser. We recommend enterprise or zero-retention
          tiers where your provider offers them.
        </p>
      </Section>

      <Section id="cookies" heading="9. Cookies">
        <p>
          Dataverse sets two cookies, both strictly necessary, both{" "}
          <code>HttpOnly</code>, <code>Secure</code>, and <code>SameSite=Lax</code>, and neither
          readable by JavaScript:
        </p>
        <ul>
          <li>
            <code>dv_access_token</code> — your current session. Short-lived; it expires
            automatically after a period of inactivity.
          </li>
          <li>
            <code>dv_refresh_token</code> — lets your session be renewed without signing in
            again.
          </li>
        </ul>
        <p>
          Both are cleared when you sign out. We set no analytics, advertising, or
          cross-site cookies, on the application or the marketing site, which is why you are not
          asked to dismiss a cookie banner. The application also stores small non-personal
          interface preferences in your browser’s local storage; these never leave your device.
        </p>
      </Section>

      <Section id="sharing" heading="10. Sharing and disclosure">
        <p>We disclose personal data only in these circumstances:</p>
        <ul>
          <li>
            <strong>Within your workspace.</strong> Your name, email, and role are visible to
            other members of your team, as are workspace resources shared with you.
          </li>
          <li>
            <strong>To infrastructure providers.</strong> Our hosted service runs on Amazon Web
            Services, which stores and processes data on our instruction and under a data
            processing agreement. Nothing is disclosed to AWS for its own purposes.
          </li>
          <li>
            <strong>To model providers your team selects.</strong> As described in section 8.
          </li>
          <li>
            <strong>To third-party services you connect.</strong> As described in section 6, and
            only the requests you or the agent make on your behalf.
          </li>
          <li>
            <strong>Where the law requires it</strong> — in response to a valid legal process.
            Where we are permitted to tell you, we will.
          </li>
          <li>
            <strong>In a corporate transaction.</strong> If {shortName} is involved in a merger,
            acquisition, or sale of assets, personal data may transfer to the successor, which
            will remain bound by commitments no weaker than these.
          </li>
        </ul>
        <p>We do not sell personal data, and we never have.</p>
      </Section>

      <Section id="security" heading="11. Security">
        <p>Measures in place on our hosted service include:</p>
        <ul>
          <li>TLS for all traffic in transit, and encryption at rest for stored data and backups;</li>
          <li>
            passwords stored as salted PBKDF2-SHA256 hashes with a high iteration count, never
            in a recoverable form;
          </li>
          <li>
            session tokens that are opaque and stored only as hashes, delivered in{" "}
            <code>HttpOnly</code> cookies so they cannot be read by page scripts;
          </li>
          <li>
            provider API keys, database credentials, and connector tokens held in an encrypted
            vault, isolated from application records;
          </li>
          <li>
            databases in private network segments with no route to the public internet, reachable
            only by the application;
          </li>
          <li>
            least-privilege infrastructure roles, so each component can reach only the resources
            it needs;
          </li>
          <li>
            outbound requests to user-supplied hosts resolved and screened on every hop,
            including redirects, so an internal address cannot be reached from the application;
            and
          </li>
          <li>role-based access control, with table- and column-level policies inside each workspace.</li>
        </ul>
        <p>
          No system is perfectly secure. If we become aware of a breach affecting your personal
          data, we will notify you and any applicable supervisory authority without undue delay
          and within the periods the law requires. To report a vulnerability, write to{" "}
          <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>; we will not pursue researchers
          who act in good faith and give us reasonable time to fix the issue.
        </p>
      </Section>

      <Section id="retention" heading="12. Retention">
        <DefinitionTable
          columns={["Data", "How long we keep it"]}
          rows={[
            ["Account record", "For as long as your account exists, and deleted when it is deleted."],
            [
              "Workspace content — conversations, documents, rules, dashboards",
              "Until you or your team delete it, or until the workspace is deleted.",
            ],
            ["Sessions", "Until they expire or you sign out, whichever is first."],
            ["Password reset tokens", "Single use, and expiring shortly after issue."],
            ["Server logs", "A rolling retention window, typically 30 days."],
            [
              "Records we must keep by law",
              "For the period the relevant law requires, and no longer.",
            ],
          ]}
        />
        <p>
          Deleting an account removes the personal data associated with it and cascades to the
          resources it owns. Backups roll off on their own schedule, so a deleted record may
          persist in an encrypted backup for a short period before it is overwritten.
        </p>
      </Section>

      <Section id="transfers" heading="13. International transfers">
        <p>
          Our hosted service currently runs in the United States (AWS <code>us-east-1</code>).
          If you are in the United Kingdom, the European Economic Area, or another region with
          transfer restrictions, your personal data is transferred outside that region and
          protected by appropriate safeguards — Standard Contractual Clauses or the UK
          International Data Transfer Addendum, as applicable — together with the technical
          measures in section 11. A copy of the relevant safeguards is available on request.
        </p>
        <p>
          Prompts sent to a model provider your team selects may be processed in the regions
          that provider operates in. If regional processing matters to your organisation, choose
          a provider and region accordingly, or run a model inside your own environment.
        </p>
      </Section>

      <Section id="rights" heading="14. Your rights">
        <p>
          Subject to your local law, you have the right to access the personal data we hold
          about you, to have it corrected, to have it deleted, to restrict or object to how we
          process it, to receive it in a portable form, and to withdraw consent where we relied
          on consent. If you are in the EEA or UK you may also lodge a complaint with your
          supervisory authority; if you are in Singapore, with the Personal Data Protection
          Commission.
        </p>
        <p>
          Much of this you can do yourself in the application — update your profile, delete a
          conversation or a document, disconnect an account, or delete your account. For
          anything else, write to <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>. We
          respond within one month, and will tell you if we need longer because a request is
          complex.
        </p>
        <p>
          Where your organisation is the controller, we will refer a request about its content
          to it rather than acting unilaterally, and will tell you we have done so.
        </p>
      </Section>

      <Section id="children" heading="15. Children">
        <p>
          Dataverse is a business tool and is not directed at children. We do not knowingly
          collect personal data from anyone under 16. If you believe a child has provided us
          with personal data, write to <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a> and
          we will delete it.
        </p>
      </Section>

      <Section id="changes" heading="16. Changes to this policy">
        <p>
          We update this policy when the product changes or the law does. The revision date at
          the top always reflects the current version. Where a change materially affects your
          rights or how we use your data, we will give notice in the application or by email
          before it takes effect, and where the law requires consent we will ask for it rather
          than assume it.
        </p>
      </Section>

      <Section id="contact" heading="17. Contact us">
        <p>
          For any question about this policy, or to exercise a right under section 14:
        </p>
        <ContactBlock>
          <strong>{legalEntity}</strong> · UEN {uen}
          {addressLines.map((line) => (
            <span key={line}>
              <br />
              {line}
            </span>
          ))}
          <br />
          <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>
        </ContactBlock>
        <p>
          This policy is governed by the laws of {governingLaw}, without prejudice to any
          mandatory rights you have under the law of your own country of residence.
        </p>
      </Section>
    </LegalShell>
  );
}
