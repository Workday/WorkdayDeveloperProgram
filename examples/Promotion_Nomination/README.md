<h1 align="center"> Promotion Nomination App</h1>

<p align="center">
  <em>A streamlined promotion nomination platform that enables managers to identify, evaluate, and advocate for top-performing direct reports.</em>
</p>

<hr>

<h2>📋 Overview</h2>
<p>
  The <strong>Promotion Nomination App</strong> automates the collection of employee career data and routes nominations through a multi-level approval workflow, ensuring consistent evaluation, transparency, and governance across all promotion decisions.
</p>

<h2>✨ Key Features</h2>
<ul>
  <li><strong>👤 Employee Selection:</strong> Managers easily nominate from their direct reports via an intuitive dropdown interface.</li>
  <li><strong>⚡ Auto-Populated Career Data:</strong> The system automatically retrieves current job profile, tenure, hire date, and promotion history. Optionally, you can enhance it to retrieve worker Talent details from Workday or any 3rd platform</li>
  <li><strong>📝 Structured Business Case:</strong> Guided fields capture detailed nomination rationale and alignment with target roles.</li>
  <li><strong>📅 Promotion Cycle Tracking:</strong> Tag nominations to specific evaluation cycles (e.g., <code>2026-Q1</code>).</li>
  <li><strong>🔄 Approval Workflow:</strong> Automatic routing to next-level managers, followed by the People Business Partner (PBP).</li>
  <li><strong>🔒 Audit Trail:</strong> All records are securely stored in a Custom Business Object (CBO) for governance, tracking, and analytics.</li>
</ul>

<h2>⚙️ How It Works</h2>
<ol>
  <li>
    <strong>Select Employee</strong><br>
    Manager selects an eligible worker from their list of direct reports.
  </li>
  <li>
    <strong>Auto-Populate Career History</strong><br>
    The system automatically pulls key worker details:
    <ul>
      <li>Current job profile &amp; time in position</li>
      <li>Original hire date</li>
      <li>Last promotion date</li>
    </ul>
  </li>
  <li>
    <strong>Build the Rationale</strong><br>
    Manager provides promotion justification:
    <ul>
      <li><strong>Reason for Promotion:</strong> Merit, increased responsibilities, or restructuring</li>
      <li><strong>Target Role:</strong> Proposed job profile</li>
      <li><strong>Timeline:</strong> Proposed effective date</li>
      <li><strong>Business Impact:</strong> Detailed justification field</li>
    </ul>
  </li>
  <li>
    <strong>Approval &amp; Archival</strong><br>
    The nomination enters the multi-level approval chain. Once approved, all data is archived to the Custom Business Object.
  </li>
</ol>

<h2>💡 Optional Enhancements</h2>
<blockquote>
  <strong>Workday Orchestrate Integration:</strong><br>
  The app can be configured to automatically trigger a <strong>Change Job</strong> business process for the worker upon final approval completion using a <strong>Workday Orchestrate</strong> workflow.
</blockquote>
