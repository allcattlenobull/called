import { Link } from 'react-router-dom';
import { Callout, PageHeader } from '../components/ui';
import { TERMS_EFFECTIVE_DATE } from '../lib/terms';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export default function Terms() {
  useDocumentTitle('Terms of use');

  return (
    <div className="wrap wrap--narrow terms-page">
      <PageHeader title="Terms of Use" lead="Plain-language rules for using Called as a guest, with an individual account, or as a counselor." />
      <p className="small muted">Effective {TERMS_EFFECTIVE_DATE}</p>

      <Callout tone="evidence" title="The short version">
        Called helps people explore careers; it does not make decisions for them. You can use the core site without an account. Accounts add private access, backup, and sharing responsibilities. Never use a Called result as the only reason for an education, employment, or other high-stakes decision.
      </Callout>

      <nav className="card terms-nav" aria-label="Terms sections">
        <strong>Jump to</strong>
        <a href="#everyone">Terms for everyone</a>
        <a href="#guest">Using Called without an account</a>
        <a href="#account">Individual account terms</a>
        <a href="#counselor">Counselor account terms</a>
        <a href="#sharing">Sharing and privacy</a>
      </nav>

      <article className="prose terms-copy">
        <section id="everyone" aria-labelledby="everyone-h">
          <h2 id="everyone-h">1. Terms for everyone</h2>
          <p>These Terms of Use are an agreement between you and Called. They apply when you visit or use the site. If you do not agree, do not use Called.</p>
          <h3>What Called is—and is not</h3>
          <p>Called is an exploration and decision-support tool. Its assessments, career matches, simulations, reports, education estimates, local resources, and suggested next steps are informational. They are not promises, diagnoses, professional counseling, financial advice, legal advice, admissions decisions, employment decisions, or guarantees of success.</p>
          <p>You remain responsible for your choices. Check important facts with reliable current sources and, when appropriate, a qualified counselor, educator, employer, financial professional, or other trusted adult.</p>
          <h3>Age and permission</h3>
          <p>You may use Called if you can legally agree to these terms. If you are a minor, a parent or legal guardian should review these terms with you. If you are under 13, do not create an account or use connected features such as counselor sharing, email, or voluntary research participation. Device-only use must be supervised by a parent, legal guardian, or authorized school adult.</p>
          <h3>Acceptable use</h3>
          <p>You may use Called for personal, educational, counseling, and career-exploration purposes. Do not misuse the site, attempt to access another person’s journey or counselor roster, interfere with security, upload harmful code, scrape the service at unreasonable scale, impersonate someone, or use Called to discriminate or make an automated high-stakes decision.</p>
        </section>

        <section id="guest" aria-labelledby="guest-h">
          <h2 id="guest-h">2. Using Called without an account</h2>
          <p>You may use Called as a guest without activating an individual or counselor account. Guest work is ordinarily saved in that browser on that device. Called may create a local journey code and member ID so the browser can organize your work; that does not by itself create a connected account.</p>
          <ul>
            <li>Clearing browser data, losing the device, or using a different browser may make guest work unavailable.</li>
            <li>You are responsible for safeguarding exported files and any journey code you choose to save.</li>
            <li>Guest use does not include a promise of cross-device recovery, permanent storage, or support.</li>
            <li>You may stop using the site and delete local data through <Link to="/data">Privacy and data</Link>.</li>
          </ul>
          <p>By continuing past the guest notice or otherwise using the site, you accept these general and guest terms.</p>
        </section>

        <section id="account" aria-labelledby="account-h">
          <h2 id="account-h">3. Individual account terms</h2>
          <p>If you activate an individual account, the terms above still apply, together with these account terms:</p>
          <ul>
            <li>Give accurate information when a real name is needed for a report you choose to share.</li>
            <li>Keep your journey code and any access key private. Anyone who has a secret account key may be able to open the associated information.</li>
            <li>You are responsible for activity performed with your credentials and for keeping your device, exported files, and email secure.</li>
            <li>Some account functions require a connected service. If that service is unavailable, device-only storage and exports may be the only available options.</li>
            <li>You may export or delete your journey using the controls in <Link to="/data">Privacy and data</Link>. Deleting local data cannot erase copies you previously exported, emailed, printed, or shared with another person.</li>
          </ul>
          <p>Called may suspend access needed to protect users, investigate abuse, comply with law, or maintain the service. You may stop using account features at any time.</p>
        </section>

        <section id="counselor" aria-labelledby="counselor-h">
          <h2 id="counselor-h">4. Counselor account terms</h2>
          <p>A counselor account is for a counselor, educator, advisor, or other authorized adult supporting career exploration. By creating or using one, you also agree that you will:</p>
          <ul>
            <li>Access only reports that a person deliberately shared with you and use them only to support that person.</li>
            <li>Protect your counselor ID, private access key, roster, notes, downloads, and any copies you create.</li>
            <li>Follow your school’s or organization’s policies and all laws that apply to student or client information.</li>
            <li>Use Called results as conversation starters and supporting evidence—not as the sole basis for admissions, grading, discipline, employment, placement, eligibility, or another high-stakes decision.</li>
            <li>Correct or remove information when appropriate and delete records you no longer have a legitimate reason to keep.</li>
            <li>Not redisclose a person’s report unless that person, or an authorized parent or guardian where required, has agreed or the law clearly permits it.</li>
          </ul>
          <p>A school or organization remains responsible for deciding whether and how Called fits its legal duties, consent process, records policy, accessibility obligations, and security requirements. Creating a counselor account does not make Called a school official, agent, or contracted records provider.</p>
        </section>

        <section id="sharing" aria-labelledby="sharing-h">
          <h2 id="sharing-h">5. Sharing, privacy, and research</h2>
          <p>Sharing is optional. Before sharing, review what the report contains and confirm the intended recipient. A counselor report may include a first and last name, Called member ID, progress summary, interests, strengths, values, career possibilities, and paths. It does not intentionally include the journey code, private journal, or item-level assessment answers.</p>
          <p>Stopping an active share prevents future access through that connection when the connected service supports revocation. It cannot retrieve screenshots, downloads, printed reports, emails, or other copies already made by a recipient.</p>
          <p>Voluntary research and product analytics are off by default and are governed by the choices shown in <Link to="/data#research">Privacy and data</Link>. Do not submit another person’s personal information in free-text fields without permission.</p>
        </section>

        <section aria-labelledby="content-h">
          <h2 id="content-h">6. Content, links, and ownership</h2>
          <p>You keep ownership of text and other content you enter. You give Called only the limited permission needed to process, save, encrypt, display, export, or share it as you direct. Called does not claim ownership of your journal or responses.</p>
          <p>The Called software, design, original text, and branding remain protected by applicable intellectual-property laws and licenses. Career facts, wage data, occupational information, research citations, and third-party links may come from outside sources. Their owners retain their rights, and Called is not responsible for third-party services or changes to their information.</p>
        </section>

        <section aria-labelledby="availability-h">
          <h2 id="availability-h">7. Availability and changes</h2>
          <p>Called may add, change, pause, or remove features. We try to describe the site honestly, but the service is provided “as is” and “as available,” without a guarantee that it will always be accurate, uninterrupted, secure, or error-free.</p>
          <p>We may update these terms. The page will show a new effective date, and account holders may be asked to accept material changes before continuing to use account features. Continued guest use after updated terms are posted means you accept the updated guest terms.</p>
        </section>

        <section aria-labelledby="liability-h">
          <h2 id="liability-h">8. Responsibility and limits</h2>
          <p>To the fullest extent permitted by law, Called and its contributors are not liable for indirect, incidental, special, consequential, or punitive damages, lost opportunities, lost data, or decisions made using the site. Nothing in these terms excludes rights or responsibilities that cannot legally be excluded.</p>
          <p>If a court finds part of these terms unenforceable, the rest remains in effect. Not enforcing a provision once does not waive it. These terms, together with the disclosures in <Link to="/data">Privacy and data</Link>, are the entire agreement about using Called unless a separate written agreement applies.</p>
        </section>

        <section aria-labelledby="questions-h">
          <h2 id="questions-h">9. Questions</h2>
          <p>For product questions, use <Link to="/feedback">Give feedback</Link>. For a terms, privacy, or safety concern, open an issue in the <a href="https://github.com/allcattlenobull/called/issues" target="_blank" rel="noreferrer">Called project issue tracker</a> without posting personal information. Formal contact information should be added here before connected account services are opened to the public.</p>
        </section>
      </article>

    </div>
  );
}
