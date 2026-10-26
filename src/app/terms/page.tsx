import type { Metadata } from "next";

import {
  addressLines,
  appUrl,
  contactEmail,
  governingLaw,
  jurisdiction,
  legalEntity,
  shortName,
  uen,
} from "@/features/legal/company";
import { fontClassName } from "@/lib/fonts";
import {
  Callout,
  ContactBlock,
  LegalShell,
  Section,
} from "@/features/legal/legal-shell";
import { getMetadataBase, siteName } from "@/lib/site";

const pageTitle = "Terms of Service";
const pageDescription =
  "The terms governing use of Dataverse, including the closed beta, acceptable use, ownership of your data, and the limits of AI-generated output.";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: "/terms" },
  openGraph: {
    title: `${pageTitle} | ${siteName}`,
    description: pageDescription,
    url: "/terms",
    siteName,
    locale: "en_US",
    type: "website",
  },
  robots: { index: true, follow: true },
};

const sections = [
  { id: "agreement", label: "Agreement to these terms" },
  { id: "beta", label: "The closed beta" },
  { id: "accounts", label: "Eligibility and accounts" },
  { id: "workspaces", label: "Workspaces and roles" },
  { id: "acceptable-use", label: "Acceptable use" },
  { id: "your-content", label: "Your content" },
  { id: "ai-output", label: "AI-generated output" },
  { id: "third-party", label: "Third-party services" },
  { id: "availability", label: "Availability and support" },
  { id: "fees", label: "Fees" },
  { id: "confidentiality", label: "Confidentiality" },
  { id: "ip", label: "Intellectual property" },
  { id: "feedback", label: "Feedback" },
  { id: "termination", label: "Term and termination" },
  { id: "disclaimers", label: "Disclaimers" },
  { id: "liability", label: "Limitation of liability" },
  { id: "indemnity", label: "Indemnity" },
  { id: "changes", label: "Changes" },
  { id: "law", label: "Governing law" },
  { id: "general", label: "General" },
  { id: "contact", label: "Contact" },
] as const;

export default function TermsOfService() {
  return (
    <LegalShell
      current="terms"
      eyebrow="Legal"
      title={pageTitle}
      fontClassName={fontClassName}
      sections={sections}
      lede={
        <p>
          These terms are a contract between you and {legalEntity} (UEN {uen}), the company
          behind Dataverse. They are written to be read, not to be survived — plain about what
          you get, what we expect of you, and{" "}
          <strong>what a service that generates SQL with a language model can and cannot be
          relied upon to do</strong>. Section 7 is the one to read carefully.
        </p>
      }
    >
      <Section id="agreement" heading="1. Agreement to these terms">
        <p>
          By creating a Dataverse account, signing in, or using the service in any way, you
          agree to these Terms of Service (the “<strong>Terms</strong>”). If you do not agree,
          do not use Dataverse.
        </p>
        <p>
          If you are accepting these Terms on behalf of an organisation, you confirm that you
          have authority to bind it, and “<strong>you</strong>” means that organisation and its
          users. Where your organisation has signed a separate written agreement with{" "}
          {shortName} covering Dataverse, that agreement prevails over these Terms to the extent
          of any conflict.
        </p>
        <p>
          Our <a href="/privacy">Privacy Policy</a> is incorporated into these Terms by
          reference.
        </p>
      </Section>

      <Section id="beta" heading="2. The closed beta">
        <p>
          Dataverse is currently offered as a <strong>closed beta</strong>. Access is by
          invitation only: an account can be created only by an address that a Dataverse
          administrator has allowed, individually or by organisation domain, or one we have
          issued directly. There is no public sign-up, and access is not transferable.
        </p>
        <p>During the beta you should expect, and accept, that:</p>
        <ul>
          <li>
            features may change, be added, or be withdrawn without notice, and interfaces may
            change in ways that break what you built on them;
          </li>
          <li>
            defects are likely, and answers may occasionally be wrong, slow, or unavailable;
          </li>
          <li>
            we may need to reset, migrate, or delete beta data, and we do not guarantee it will
            survive into general availability; and
          </li>
          <li>
            we may end your participation, or the beta itself, at any time on reasonable notice.
          </li>
        </ul>
        <Callout>
          <p>
            <strong>Do not use the beta as a system of record</strong> or as the sole basis for a
            decision you cannot afford to get wrong. It has no service-level commitment, and the
            disclaimers in sections 15 and 16 apply in full.
          </p>
        </Callout>
      </Section>

      <Section id="accounts" heading="3. Eligibility and accounts">
        <p>
          You must be at least 16 years old and capable of forming a binding contract. Accounts
          are personal to one individual: do not share credentials, and do not let anyone else
          use your account.
        </p>
        <p>
          You are responsible for the security of your credentials and for everything done under
          your account. Where we issue you a temporary password directly, it is shown once and
          you should change it on first sign-in. Tell us promptly at{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a> if you suspect unauthorised
          access.
        </p>
        <p>
          Information you give us when registering must be accurate, and you must keep it
          current.
        </p>
      </Section>

      <Section id="workspaces" heading="4. Workspaces and roles">
        <p>
          Dataverse is organised into workspaces. A workspace belongs to the organisation that
          created it, not to any individual member.
        </p>
        <ul>
          <li>
            <strong>Administrators</strong> of a workspace can register data sources, configure
            model providers, define roles and access policies, and add or remove members. They
            can see workspace content accordingly.
          </li>
          <li>
            <strong>Members</strong> can use the workspace subject to the policies its
            administrators set.
          </li>
          <li>
            If you join a workspace using an email address on your employer’s domain, you
            acknowledge your employer may control that workspace, including the content you
            create in it, and may add or remove your access.
          </li>
        </ul>
        <p>
          You must only connect data sources and accounts you are authorised to connect, and
          only grant access you are authorised to grant.
        </p>
      </Section>

      <Section id="acceptable-use" heading="5. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>
            use Dataverse to access data you are not authorised to access, or to circumvent any
            access control, role, or policy — ours or your organisation’s;
          </li>
          <li>
            upload or connect data you do not have the right to process, or process personal
            data without a lawful basis;
          </li>
          <li>
            use the service to break the law, infringe anyone’s rights, or produce material that
            is unlawful, defamatory, or harmful;
          </li>
          <li>
            probe, scan, or test the vulnerability of the service without our prior written
            consent, or interfere with its operation or another user’s use of it;
          </li>
          <li>
            reverse engineer, decompile, or attempt to derive the source code of the hosted
            service, except to the extent that restriction is unenforceable by law;
          </li>
          <li>
            resell, sublicense, or provide the service to a third party as a service bureau, or
            use it to build a competing product;
          </li>
          <li>
            place automated load on the service beyond ordinary use, or evade any rate or usage
            limit; or
          </li>
          <li>remove or obscure any proprietary notice.</li>
        </ul>
        <p>
          We may suspend access immediately, without notice, where we reasonably believe it is
          necessary to protect the service, other users, or a third party. We will tell you why
          as soon as we reasonably can.
        </p>
      </Section>

      <Section id="your-content" heading="6. Your content">
        <p>
          <strong>You own your content.</strong> The databases you connect, the data in them,
          the documents you upload, the rules and glossary you define, and the questions and
          answers in your workspace remain yours (or your organisation’s). We claim no ownership
          of any of it.
        </p>
        <p>
          You grant {shortName} a limited, non-exclusive, worldwide, royalty-free licence to
          host, store, transmit, display, and process that content <em>solely</em> to provide
          and support the service for you. That licence exists so the software can function; it
          ends when the content is deleted.
        </p>
        <Callout>
          <p>
            <strong>We do not train models on your content</strong> and we do not use it to
            develop or improve any machine-learning model. We do not disclose it except as
            described in the <a href="/privacy">Privacy Policy</a>.
          </p>
        </Callout>
        <p>
          You are responsible for having the rights and permissions necessary for us to process
          your content as described, and for the accuracy and legality of what you connect or
          upload.
        </p>
      </Section>

      <Section id="ai-output" heading="7. AI-generated output">
        <p>
          Dataverse answers questions by generating SQL with a language model and running it
          against your database. This is a probabilistic process. It is designed to be
          inspectable precisely because it is not infallible: the generated SQL is shown to you
          in full, alongside the schema context that produced it, so it can be reviewed rather
          than trusted blindly.
        </p>
        <Callout>
          <p>
            <strong>Output may be incorrect.</strong> A query may misinterpret your question,
            join the wrong tables, apply the wrong filter, or return a number that is plausible
            and wrong. Dataverse does not warrant that any answer, query, chart, or summary is
            accurate, complete, or fit for any purpose.
          </p>
          <p>
            <strong>You are responsible for reviewing output before you rely on it.</strong>{" "}
            Do not use Dataverse output as the sole basis for any decision with legal,
            financial, medical, safety, or employment consequences without independent
            verification by a qualified person. Do not present its output as professional advice.
          </p>
        </Callout>
        <p>
          Generated SQL executes against your data source with the credentials you configured.
          You control what those credentials can do. We strongly recommend connecting Dataverse
          with a read-only account scoped to the data it needs; where you grant broader rights,
          the consequences of a query run under them are yours.
        </p>
        <p>
          Language models can produce identical or similar output for different users asking
          similar questions. As between you and {shortName}, and to the extent output is
          capable of ownership, we do not claim ownership of the output generated for you.
        </p>
      </Section>

      <Section id="third-party" heading="8. Third-party services">
        <p>
          Dataverse connects to services you choose: your databases, the model provider your
          team configures, and any accounts you link through Connectors. Those services are
          operated by third parties under their own terms and privacy policies. We do not
          control them, we are not responsible for them, and their availability, behaviour, and
          pricing are matters between you and them.
        </p>
        <p>
          When your team configures a hosted model provider, prompts are transmitted to that
          provider under your team’s own API key and are subject to that provider’s terms. You
          are responsible for ensuring that transmission is permitted for the data involved. If
          it is not, run a model inside your own environment instead.
        </p>
      </Section>

      <Section id="availability" heading="9. Availability and support">
        <p>
          We aim to keep Dataverse available and responsive, but during the beta we offer{" "}
          <strong>no service-level agreement, uptime commitment, or guaranteed support response
          time</strong>. We may take the service down for maintenance, and deployments may
          briefly interrupt it.
        </p>
        <p>
          Support during the beta is provided on a best-efforts basis by email at{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a> and through the in-app issue
          reporter.
        </p>
      </Section>

      <Section id="fees" heading="10. Fees">
        <p>
          Dataverse is provided free of charge during the closed beta. We will not begin
          charging you without notice and your agreement to the applicable commercial terms.
        </p>
        <p>
          Costs you incur with third parties — your model provider’s API charges, your cloud
          bill, your database costs — are yours, whether or not they arise from your use of
          Dataverse. Model usage is metered in the application so you can see it.
        </p>
      </Section>

      <Section id="confidentiality" heading="11. Confidentiality">
        <p>
          Each party may receive information the other treats as confidential. The receiving
          party will use it only to perform under these Terms, protect it with at least
          reasonable care, and not disclose it except to its personnel and advisers who need it
          and are bound by comparable obligations, or where the law compels disclosure.
        </p>
        <p>
          Your content is your confidential information. Non-public information about the
          Dataverse service, including features shown to you during the beta, is ours.
        </p>
      </Section>

      <Section id="ip" heading="12. Intellectual property">
        <p>
          Dataverse — the software, models of its architecture, documentation, name, and marks —
          is owned by {legalEntity} and its licensors and is protected by intellectual property
          law. Subject to these Terms, we grant you a limited, non-exclusive,
          non-transferable, revocable right to access and use the hosted service for your
          internal business purposes during the beta. No other rights are granted, by
          implication or otherwise.
        </p>
      </Section>

      <Section id="feedback" heading="13. Feedback">
        <p>
          Feedback is the point of a beta, and we would rather have it than own it carefully. If
          you send us suggestions, bug reports, or ideas, you grant us a perpetual, irrevocable,
          royalty-free right to use them without restriction or obligation to you. Please do not
          include anything confidential or proprietary in feedback that you are not willing for
          us to use freely.
        </p>
      </Section>

      <Section id="termination" heading="14. Term and termination">
        <p>
          These Terms apply for as long as you use Dataverse. You may stop at any time and may
          ask us to delete your account.
        </p>
        <p>
          We may suspend or terminate your access, with notice where practicable, if you breach
          these Terms, if we reasonably believe your use creates risk or legal exposure, if your
          organisation removes your access, or if we discontinue the beta.
        </p>
        <p>
          On termination, your right to use the service ends. Sections 6 (as to ownership), 11,
          12, 13, 15, 16, 17, 19, and 20 survive. We will delete or return your content in
          accordance with the <a href="/privacy">Privacy Policy</a>; export what you need before
          you close an account, because deletion cascades to the resources the account owns.
        </p>
      </Section>

      <Section id="disclaimers" heading="15. Disclaimers">
        <p>
          To the maximum extent permitted by law, Dataverse is provided “<strong>as is</strong>”
          and “<strong>as available</strong>”, and {shortName} disclaims all warranties, express
          or implied, including any implied warranty of merchantability, fitness for a
          particular purpose, title, non-infringement, and any warranty arising from course of
          dealing or usage of trade.
        </p>
        <p>
          Without limiting that, we do not warrant that the service will be uninterrupted,
          timely, secure, or error-free; that defects will be corrected; or that any output —
          including any generated query, result, chart, or summary — will be accurate,
          complete, or reliable. See section 7.
        </p>
        <p>
          Some jurisdictions do not allow the exclusion of certain warranties, so parts of this
          section may not apply to you. Nothing here limits rights you have as a consumer that
          cannot be limited by contract.
        </p>
      </Section>

      <Section id="liability" heading="16. Limitation of liability">
        <p>
          To the maximum extent permitted by law, neither party is liable for any indirect,
          incidental, special, consequential, or punitive damages, or for any loss of profits,
          revenue, goodwill, business opportunity, or data, however caused and on any theory of
          liability, even if advised of the possibility.
        </p>
        <p>
          To the maximum extent permitted by law, {shortName}’s total aggregate liability arising
          out of or relating to these Terms or the service will not exceed the greater of the
          amounts you paid us for the service in the twelve months before the event giving rise
          to the claim, or <strong>one hundred Singapore dollars (S$100)</strong>. You
          acknowledge that during the free beta this figure is likely to be the latter, and that
          this allocation of risk is a basis of our agreement to provide the service at no
          charge.
        </p>
        <p>
          Nothing in these Terms excludes or limits liability for fraud, fraudulent
          misrepresentation, death or personal injury caused by negligence, or any other
          liability that cannot lawfully be excluded.
        </p>
      </Section>

      <Section id="indemnity" heading="17. Indemnity">
        <p>
          You will indemnify and hold harmless {legalEntity}, its officers, employees, and
          agents against any claim, loss, or expense (including reasonable legal fees) arising
          from your content, your use of the service in breach of these Terms or the law, or
          your connection of a data source or account you were not authorised to connect.
        </p>
      </Section>

      <Section id="changes" heading="18. Changes">
        <p>
          We may change the service, and we may change these Terms. Where a change to these
          Terms is material, we will give reasonable notice — in the application or by email —
          before it takes effect. Continuing to use Dataverse after that means you accept the
          revised Terms; if you do not, stop using the service and ask us to close your account.
        </p>
        <p>The revision date at the top of this page always identifies the current version.</p>
      </Section>

      <Section id="law" heading="19. Governing law and disputes">
        <p>
          These Terms are governed by the laws of {governingLaw}, without regard to its conflict
          of law rules. The parties submit to the exclusive jurisdiction of {jurisdiction}, save
          that either party may seek injunctive relief in any court of competent jurisdiction to
          protect its intellectual property or confidential information.
        </p>
        <p>
          Before filing a claim, please contact us at{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. Most disputes are resolved
          faster that way than by either party’s lawyers.
        </p>
      </Section>

      <Section id="general" heading="20. General">
        <ul>
          <li>
            <strong>Entire agreement.</strong> These Terms and the Privacy Policy are the entire
            agreement between us about Dataverse, and supersede prior discussions, except where
            a signed written agreement with {shortName} applies.
          </li>
          <li>
            <strong>Severability.</strong> If a provision is held unenforceable, it is modified
            to the minimum extent necessary and the rest remains in force.
          </li>
          <li>
            <strong>No waiver.</strong> Not enforcing a provision is not a waiver of it.
          </li>
          <li>
            <strong>Assignment.</strong> You may not assign these Terms without our written
            consent. We may assign them to an affiliate or in connection with a merger,
            acquisition, or sale of assets.
          </li>
          <li>
            <strong>Force majeure.</strong> Neither party is liable for a failure to perform
            caused by events beyond its reasonable control.
          </li>
          <li>
            <strong>No agency.</strong> These Terms create no partnership, agency, or employment
            relationship.
          </li>
          <li>
            <strong>Third parties.</strong> No one other than the parties has any right to
            enforce these Terms.
          </li>
        </ul>
      </Section>

      <Section id="contact" heading="21. Contact">
        <p>Questions about these Terms:</p>
        <ContactBlock>
          <strong>{legalEntity}</strong> · UEN {uen}
          {addressLines.map((line) => (
            <span key={line}>
              <br />
              {line}
            </span>
          ))}
          <br />
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          <br />
          <a href={appUrl}>{appUrl.replace("https://", "")}</a>
        </ContactBlock>
      </Section>
    </LegalShell>
  );
}
