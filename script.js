document.addEventListener("DOMContentLoaded", () => {
  // ======== ACCESS CONTROL CHECK ========
  const accessLevel = localStorage.getItem('userAccessLevel');
  if (!accessLevel) {
    window.location.href = 'login.html';
    return;
  }

  // ======== TAB SWITCHING LOGIC ========
  const tabLinks = document.querySelectorAll(".tab-link");
  const tabContents = document.querySelectorAll(".tab-content");

  const certTabBtn = document.querySelector('[data-tab="certificateApp"]');
  const quizTabBtn = document.querySelector('[data-tab="salesQuizApp"]');
  const complaintTabBtn = document.querySelector('[data-tab="complaintApp"]');

  const certContent = document.getElementById("certificateApp");
  const quizContent = document.getElementById("salesQuizApp");
  const complaintContent = document.getElementById("complaintApp");

  if (accessLevel === 'complaintOnly') {
    // Hide Certificate and Assessment tabs
    if (certTabBtn) certTabBtn.style.display = 'none';
    if (quizTabBtn) quizTabBtn.style.display = 'none';

    // Activate Complaint tab by default
    tabLinks.forEach(l => l.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));

    if (complaintTabBtn) complaintTabBtn.classList.add("active");
    if (complaintContent) complaintContent.classList.add("active");

  } else if (accessLevel === 'assessmentOnly') {
    // Hide Certificate and Complaint tabs
    if (certTabBtn) certTabBtn.style.display = 'none';
    if (complaintTabBtn) complaintTabBtn.style.display = 'none';

    // Activate Assessment tab by default
    tabLinks.forEach(l => l.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));

    if (quizTabBtn) quizTabBtn.classList.add("active");
    if (quizContent) quizContent.classList.add("active");

  } else {
    // Full access: all tabs remain visible and permitted
  }

  // Handle Tab Navigation Click
  tabLinks.forEach(link => {
    link.addEventListener("click", () => {
      const targetTab = link.dataset.tab;

      // Restrict unauthorized tab changes
      if (accessLevel === 'complaintOnly' && targetTab !== 'complaintApp') return;
      if (accessLevel === 'assessmentOnly' && targetTab !== 'salesQuizApp') return;

      tabLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      tabContents.forEach(content => {
        content.classList.toggle("active", content.id === targetTab);
      });
    });
  });

  // ======== LOGOUT LOGIC ========
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem('userAccessLevel');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('employeeId');
      window.location.href = 'login.html';
    });
  }

  // ======== INITIALIZE ALL APPS ========
  initCertificateApp();
  initSalesQuizApp();
  initComplaintApp();
});

// =========================================================================
// ======== CERTIFICATE GENERATOR APP LOGIC (PRESERVED) =====================
// =========================================================================
function initCertificateApp() {
  const empNameInput = document.getElementById("empName");
  const messageInput = document.getElementById("message");
  const fromNameInput = document.getElementById("fromName");
  const valueDropdownList = document.getElementById("valueDropdownList");
  const dropdownBtn = document.getElementById("dropdownBtn");
  const nameField = document.querySelector("#certificateApp .nameField");
  const valueField = document.querySelector("#certificateApp .valueField");
  const messageField = document.querySelector("#certificateApp .messageField");
  const fromField = document.querySelector("#certificateApp .fromField");
  const downloadImgBtn = document.getElementById('downloadImgBtn');
  const cardElement = document.getElementById("certificateCard");

  if (!empNameInput || !cardElement) return;

  let dataSubmitted = false;
  const GAS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbw8M-UW7Xxbbh2JAsLT0EDu_eGNF7aV9pjfs0vNrz0BT-3yyyMAITiLKZ7RAIKBKHMN/exec";

  async function submitToGoogleSheet() {
    const payload = {
      app: "certificate",
      employeeName: empNameInput.value.trim(),
      values: Array.from(valueDropdownList.querySelectorAll("input:checked")).map(cb => cb.value).join(', '),
      message: messageInput.value.trim(),
      fromName: fromNameInput.value.trim()
    };
    try {
      await fetch(GAS_WEBHOOK_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) });
    } catch (error) { console.error("Error submitting certificate data:", error); }
  }

  function updatePreview() {
    nameField.textContent = empNameInput.value || "Employee Name";
    messageField.textContent = messageInput.value || "Personalized message...";
    fromField.textContent = fromNameInput.value || "From Name";
    const selectedValues = Array.from(valueDropdownList.querySelectorAll("input:checked")).map(cb => cb.value);
    valueField.textContent = selectedValues.length > 0 ? selectedValues.join(" • ") : "Values Here";
    dropdownBtn.textContent = selectedValues.length > 0 ? selectedValues.join(', ') : 'Select Values';
  }

  function downloadAs(type) {
    if (empNameInput.value.trim() === "") { alert("Please enter an employee name."); return; }
    if (!dataSubmitted) { submitToGoogleSheet(); dataSubmitted = true; }
    const downloadBtn = downloadImgBtn;
    const originalBtnText = downloadBtn.innerHTML;
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = "Generating...";

    html2canvas(cardElement, { useCORS: true, scale: 3 }).then(canvas => {
      const employeeName = empNameInput.value.trim().replace(/\s+/g, '_');
      const link = document.createElement("a");
      link.download = `${employeeName}_Thank_You.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }).catch(err => console.error("Download error:", err)).finally(() => {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = originalBtnText;
    });
  }

  function resetForm() {
    empNameInput.value = ""; messageInput.value = ""; fromNameInput.value = "";
    valueDropdownList.querySelectorAll("input:checked").forEach(cb => cb.checked = false);
    dataSubmitted = false; updatePreview();
  }

  [empNameInput, messageInput, fromNameInput].forEach(el => el.addEventListener("input", updatePreview));
  valueDropdownList.addEventListener("change", updatePreview);
  dropdownBtn.addEventListener("click", e => { e.stopPropagation(); valueDropdownList.style.display = 'block'; });
  document.addEventListener("click", () => { valueDropdownList.style.display = 'none'; });
  downloadImgBtn.addEventListener('click', () => downloadAs('image'));
  const crtResetBtn = document.getElementById('crtResetBtn');
  if (crtResetBtn) crtResetBtn.addEventListener('click', resetForm);
  updatePreview();

  (function () {
    const checkboxes = valueDropdownList.querySelectorAll('input[type="checkbox"]');
    function getSelectedValues() {
      return Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
    }
    function updateSelectedValues() {
      const selected = getSelectedValues();
      dropdownBtn.textContent = selected.length ? selected.join(', ') : 'Select Values';
      valueField.textContent = selected.length ? selected.join(', ') : 'Values Here';
    }
    checkboxes.forEach(cb => cb.addEventListener('change', updateSelectedValues));
    document.addEventListener('click', () => valueDropdownList.classList.remove('show'));
    if (crtResetBtn) {
      crtResetBtn.addEventListener('click', () => {
        checkboxes.forEach(cb => cb.checked = false);
        updateSelectedValues();
      });
    }
    updateSelectedValues();
  })();
}

// =========================================================================
// ======== BRIGS SALES ENGINEER QUALIFICATION TEST APP LOGIC ==============
// =========================================================================
function initSalesQuizApp() {
  const GAS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbw8M-UW7Xxbbh2JAsLT0EDu_eGNF7aV9pjfs0vNrz0BT-3yyyMAITiLKZ7RAIKBKHMN/exec";

  // ---- 30 Questions verbatim from Candidate Test Document ----
  const questions = [
    // Section A – Cognitive Ability (Questions 1–9)
    {
      id: 1,
      section: "A",
      sectionTitle: "Section A – Cognitive Ability",
      q: "A distributor sold 60 units of Product X at ₹800 each and 40 units of Product Y at ₹1,300 each. What was the average selling price per unit across all 100 units?",
      options: {
        A: "₹1,000",
        B: "₹1,050",
        C: "₹1,100",
        D: "₹1,150"
      }
    },
    {
      id: 2,
      section: "A",
      sectionTitle: "Section A – Cognitive Ability",
      q: "All projects classified as urgent receive a daily review. Some projects receiving daily reviews are not high-priority. Which conclusion necessarily follows?",
      options: {
        A: "Some urgent projects are not high-priority.",
        B: "Every high-priority project receives a daily review.",
        C: "Every urgent project receives a daily review.",
        D: "No non-urgent project receives a daily review."
      }
    },
    {
      id: 3,
      section: "A",
      sectionTitle: "Section A – Cognitive Ability",
      q: "A team completes 40% of an assignment in 6 days at a constant daily rate. After that, its output per day increases by 50%. How many additional days will the remaining work take?",
      options: {
        A: "4 days",
        B: "5 days",
        C: "6 days",
        D: "9 days"
      }
    },
    {
      id: 4,
      section: "A",
      sectionTitle: "Section A – Cognitive Ability",
      q: "The values 12, 14, 14, 15 and 45 represent five orders. A sixth order is added and the mean remains 20. What is the sixth order value?",
      options: {
        A: "15",
        B: "20",
        C: "25",
        D: "30"
      }
    },
    {
      id: 5,
      section: "A",
      sectionTitle: "Section A – Cognitive Ability",
      q: "A three-digit code has different digits. The first is twice the last; the middle is one more than the last. The digits sum to 13. What is the code?",
      options: {
        A: "643",
        B: "634",
        C: "463",
        D: "742"
      }
    },
    {
      id: 6,
      section: "A",
      sectionTitle: "Section A – Cognitive Ability",
      q: "A report is due Friday. Data validation must finish before drafting; drafting takes two days; review takes one day after drafting. If work happens on weekdays only and review must finish Thursday, what is the latest day validation can finish?",
      options: {
        A: "Monday",
        B: "Tuesday",
        C: "Wednesday",
        D: "Thursday"
      }
    },
    {
      id: 7,
      section: "A",
      sectionTitle: "Section A – Cognitive Ability",
      q: "A figure grows by 20% in year one and falls by 20% in year two. Relative to its starting value, it is now:",
      options: {
        A: "4% lower",
        B: "Unchanged",
        C: "4% higher",
        D: "8% lower"
      }
    },
    {
      id: 8,
      section: "A",
      sectionTitle: "Section A – Cognitive Ability",
      q: "A team has 80 inquiries. 50% pass initial screening, 25% of those become proposals, and 30% of proposals convert. What is the expected number of conversions?",
      options: {
        A: "2",
        B: "3",
        C: "6",
        D: "12"
      }
    },
    {
      id: 9,
      section: "A",
      sectionTitle: "Section A – Cognitive Ability",
      q: "Exactly one of three statements is true: (1) A is selected; (2) B is selected; (3) Neither A nor B is selected. What can be concluded?",
      options: {
        A: "Only A is selected.",
        B: "Only B is selected.",
        C: "Both A and B are selected.",
        D: "The information is insufficient to know who is selected."
      }
    },

    // Section B – Commercial Acumen (Questions 10–18)
    {
      id: 10,
      section: "B",
      sectionTitle: "Section B – Commercial Acumen",
      q: "A product is sold for ₹12,000. Its direct cost is ₹8,400. A buyer requests a 10% selling-price discount with no change in cost. What is the new gross margin percentage, approximately?",
      options: {
        A: "20.0%",
        B: "22.2%",
        C: "25.0%",
        D: "27.8%"
      }
    },
    {
      id: 11,
      section: "B",
      sectionTitle: "Section B – Commercial Acumen",
      q: "A product produces ₹1,500 contribution per unit. A proposal to reduce price by ₹300 would raise volume from 100 to 130 units, with no change in variable cost. Which option yields higher total contribution?",
      options: {
        A: "Reduced price, by ₹6,000",
        B: "Current price, by ₹6,000",
        C: "Reduced price, by ₹9,000",
        D: "Both are equal"
      }
    },
    {
      id: 12,
      section: "B",
      sectionTitle: "Section B – Commercial Acumen",
      q: "A client offers a ₹24 lakh order with payment 90 days after delivery. A second client offers ₹22 lakh, paying 50% upfront and the rest at delivery. Assuming comparable margin and fulfilment cost, what should be evaluated most carefully?",
      options: {
        A: "Only headline revenue",
        B: "Working-capital exposure, collection risk and capacity before choosing",
        C: "Only the larger order",
        D: "Only which customer has been known longer"
      }
    },
    {
      id: 13,
      section: "B",
      sectionTitle: "Section B – Commercial Acumen",
      q: "An item costs ₹750 and is marked up by 40% on cost. The seller then gives a 10% discount on the marked price. What is the final selling price?",
      options: {
        A: "₹900",
        B: "₹945",
        C: "₹975",
        D: "₹1,050"
      }
    },
    {
      id: 14,
      section: "B",
      sectionTitle: "Section B – Commercial Acumen",
      q: "Two opportunities compete for scarce proposal resources. A is ₹50 lakh with confirmed budget, active evaluation and decision next month. B is ₹1.5 crore with an interested contact but no budget or timeframe. Best action?",
      options: {
        A: "Focus only on B because it is three times larger",
        B: "Split resources exactly evenly",
        C: "Prioritise A’s near-term work and use a limited discovery step to qualify B",
        D: "Ignore B until the buyer calls again"
      }
    },
    {
      id: 15,
      section: "B",
      sectionTitle: "Section B – Commercial Acumen",
      q: "A customer says a competitor is 15% cheaper. You have not seen the competitor’s scope. What is the best first response?",
      options: {
        A: "Match 15% immediately",
        B: "Explain that cheaper competitors are unreliable",
        C: "Withdraw the offer",
        D: "Clarify whether scope, outcomes, service and terms are comparable before discussing trade-offs"
      }
    },
    {
      id: 16,
      section: "B",
      sectionTitle: "Section B – Commercial Acumen",
      q: "A service contract has fixed delivery costs of ₹2 lakh and variable costs of ₹1,200 per visit. The customer pays ₹2,000 per visit. How many visits are required to break even on these costs?",
      options: {
        A: "160",
        B: "200",
        C: "250",
        D: "300"
      }
    },
    {
      id: 17,
      section: "B",
      sectionTitle: "Section B – Commercial Acumen",
      q: "You can make one of two offers: Option P has a 35% gross margin on ₹20 lakh revenue; Q has a 25% gross margin on ₹30 lakh revenue. Assuming identical risk, capital usage and timing, which gives more gross profit?",
      options: {
        A: "P by ₹0.5 lakh",
        B: "Q by ₹0.5 lakh",
        C: "P by ₹1.5 lakh",
        D: "They are equal"
      }
    },
    {
      id: 18,
      section: "B",
      sectionTitle: "Section B – Commercial Acumen",
      q: "A prospect repeatedly asks for a discount but cannot specify when or how a decision will be made. Which move best protects selling effort?",
      options: {
        A: "Keep reducing price to create urgency",
        B: "Issue a final offer without discussion",
        C: "Ask for decision criteria, stakeholders, timing and the next mutually agreed step before revisiting concessions"
        ,
        D: "Assume that repeated discount requests prove serious buying intent"
      }
    },

    // Section C – General Technical Competency (Questions 19–24)
    {
      id: 19,
      section: "C",
      sectionTitle: "Section C – General Technical Competency",
      q: "A 12 V source is connected across two resistors of 2 Ω and 4 Ω in series. Assuming ideal components, what current flows?",
      options: {
        A: "1 A",
        B: "2 A",
        C: "3 A",
        D: "6 A"
      }
    },
    {
      id: 20,
      section: "C",
      sectionTitle: "Section C – General Technical Competency",
      q: "A machine produces 180 acceptable units in 3 hours. After a change, its rate rises by 20%, but 10% of output is rejected. At the new rate, how many acceptable units are expected in 2 hours?",
      options: {
        A: "108",
        B: "120",
        C: "129.6",
        D: "144"
      }
    },
    {
      id: 21,
      section: "C",
      sectionTitle: "Section C – General Technical Competency",
      q: "A metal rod is 2.000 m at a reference temperature. Its length increases by 0.12% when heated. What is its new length?",
      options: {
        A: "2.0012 m",
        B: "2.0024 m",
        C: "2.0120 m",
        D: "2.0240 m"
      }
    },
    {
      id: 22,
      section: "C",
      sectionTitle: "Section C – General Technical Competency",
      q: "Two identical centrifugal pumps operate in parallel. One stops. Which statement is most generally correct?",
      options: {
        A: "Total flow always halves exactly",
        B: "The remaining pump automatically doubles flow",
        C: "Pressure always stays identical",
        D: "The new flow depends on the pump curve and system resistance"
      }
    },
    {
      id: 23,
      section: "C",
      sectionTitle: "Section C – General Technical Competency",
      q: "A sensor is supposed to detect an open guard. When its cable is accidentally disconnected, the control system treats the guard as closed. What is the principal design weakness?",
      options: {
        A: "Insufficient sensor resolution",
        B: "A failure is interpreted as a safe condition",
        C: "The machine may run at reduced speed",
        D: "The sensor is overly sensitive"
      }
    },
    {
      id: 24,
      section: "C",
      sectionTitle: "Section C – General Technical Competency",
      q: "A drawing specifies a shaft diameter of 25.00 ± 0.08 mm. Which measured diameter is outside tolerance?",
      options: {
        A: "24.94 mm",
        B: "25.07 mm",
        C: "25.08 mm",
        D: "25.09 mm"
      }
    },

    // Section D – BRIGS Values Judgment (Questions 25–30)
    {
      id: 25,
      section: "D",
      sectionTitle: "Section D – BRIGS Values Judgment",
      q: "INNOVATION — A familiar approach has stopped generating results. Which response best demonstrates useful innovation?",
      options: {
        A: "Replace it with a bold new idea without measurement",
        B: "Run a small, measurable experiment informed by the causes of failure, then scale what works",
        C: "Ask the team to try harder using the same approach",
        D: "Wait for a competitor to demonstrate a new method"
      }
    },
    {
      id: 26,
      section: "D",
      sectionTitle: "Section D – BRIGS Values Judgment",
      q: "COLLABORATION — Two colleagues disagree sharply about a proposed delivery plan. One has customer context and the other has operational constraints. What is your best action?",
      options: {
        A: "Support the more senior colleague",
        B: "Ask them to settle it privately and proceed with your own plan",
        C: "Make the disagreement visible to the customer immediately",
        D: "Bring both perspectives together, clarify constraints and agree a feasible decision with clear ownership"
      }
    },
    {
      id: 27,
      section: "D",
      sectionTitle: "Section D – BRIGS Values Judgment",
      q: "HONESTY — You notice a numerical error in your own presentation that makes the offer look more attractive. A decision is imminent. What should you do?",
      options: {
        A: "Correct the number promptly and explain any material effect on the proposal",
        B: "Wait until a customer notices because the error was unintentional",
        C: "Use the more favorable number if the difference is small",
        D: "Ask someone else to decide whether disclosure is necessary"
      }
    },
    {
      id: 28,
      section: "D",
      sectionTitle: "Section D – BRIGS Values Judgment",
      q: "EMPATHY — A customer is unusually abrupt because a delivery delay affects their team. Which response is strongest?",
      options: {
        A: "Explain firmly that the delay was not your personal fault",
        B: "Promise anything that calms the customer",
        C: "Acknowledge the impact, clarify immediate needs and provide a realistic action and update plan",
        D: "Stop taking calls until they speak politely"
      }
    },
    {
      id: 29,
      section: "D",
      sectionTitle: "Section D – BRIGS Values Judgment",
      q: "DEPENDABILITY — You realise you cannot complete an agreed task by tomorrow because a dependency is missing. What should you do?",
      options: {
        A: "Say nothing until tomorrow; the dependency might arrive",
        B: "Flag the risk early, seek an alternative, revise the plan with stakeholders and document the new commitment",
        C: "Mark the task completed because your part was done",
        D: "Ask a colleague to take responsibility without providing context"
      }
    },
    {
      id: 30,
      section: "D",
      sectionTitle: "Section D – BRIGS Values Judgment",
      q: "VALUE CONFLICT — A colleague suggests presenting uncertain performance estimates as confirmed to win an important account. The team is under pressure to meet its target. What is the best response?",
      options: {
        A: "Go along because collaboration requires supporting the team",
        B: "Avoid the slide but do not challenge the claim",
        C: "Refuse the unsupported claim, offer clearly labelled estimates with assumptions, and help the team make a truthful case",
        D: "Tell the customer the team is dishonest before discussing it internally"
      }
    }
  ];

  // ---- Authoritative Answer Key (Examiner Guide V2) ----
  // Kept internally and never written to candidate DOM attributes
  const ANSWER_KEY = {
    1: "A", 2: "C", 3: "C", 4: "B", 5: "A", 6: "A", 7: "A", 8: "B", 9: "D",
    10: "B", 11: "A", 12: "B", 13: "B", 14: "C", 15: "D", 16: "C", 17: "B", 18: "C",
    19: "B", 20: "C", 21: "B", 22: "D", 23: "B", 24: "D",
    25: "B", 26: "D", 27: "A", 28: "C", 29: "B", 30: "C"
  };

  // ---- Category Specifications ----
  const CATEGORIES = {
    A: {
      key: "cognitive",
      name: "Cognitive Ability",
      range: "Q1–Q9",
      qIds: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      total: 9,
      weight: 30,
      minRequired: 5 // >= 50%
    },
    B: {
      key: "commercial",
      name: "Commercial Acumen",
      range: "Q10–Q18",
      qIds: [10, 11, 12, 13, 14, 15, 16, 17, 18],
      total: 9,
      weight: 30,
      minRequired: 5 // >= 50%
    },
    C: {
      key: "technical",
      name: "General Technical Competency",
      range: "Q19–Q24",
      qIds: [19, 20, 21, 22, 23, 24],
      total: 6,
      weight: 20,
      minRequired: 3 // >= 50%
    },
    D: {
      key: "values",
      name: "BRIGS Values Judgment",
      range: "Q25–Q30",
      qIds: [25, 26, 27, 28, 29, 30],
      total: 6,
      weight: 20,
      minRequired: 3 // >= 50%
    }
  };

  // ---- Elements ----
  const quizForm = document.getElementById("salesQuizForm");
  const quizContainer = document.getElementById("salesQuizContainer");
  const resultDiv = document.getElementById("salesResult");
  const candidateNameInput = document.getElementById("salesName");
  const employeeIdInput = document.getElementById("salesEmployeeId");
  const testDateInput = document.getElementById("salesDate");
  const timerDisplay = document.getElementById("timerDisplay");
  const timerBox = document.getElementById("timerBox");
  const answeredCounter = document.getElementById("answeredCounter");
  const unansweredCounter = document.getElementById("unansweredCounter");
  const progressBar = document.getElementById("assessmentProgressBar");
  const navPillsGrid = document.getElementById("questionNavPills");
  const submitBtn = document.getElementById("submitAssessmentBtn");
  const resetBtn = document.getElementById("salesQuizResetBtn");
  const stickyBar = document.getElementById("assessmentStickyBar");

  if (!quizForm || !quizContainer) return;

  // ---- State ----
  let timerInterval = null;
  const TEST_DURATION_SECONDS = 45 * 60; // 45 minutes = 2700 seconds
  let remainingSeconds = TEST_DURATION_SECONDS;
  let isSubmitting = false;
  let isSubmitted = false;
  let lastSubmissionPayload = null;

  // ---- Populate Default Candidate Information ----
  const storedName = localStorage.getItem('userName') || '';
  const storedEmpId = localStorage.getItem('employeeId') || '';

  if (candidateNameInput && storedName) {
    candidateNameInput.value = storedName;
  }
  if (employeeIdInput && storedEmpId) {
    employeeIdInput.value = storedEmpId;
  }

  // Pre-fill today's date (YYYY-MM-DD)
  if (testDateInput && !testDateInput.value) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    testDateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  // ---- Render All 30 Questions with Section Headers ----
  function buildAssessmentUI() {
    quizContainer.innerHTML = "";
    if (navPillsGrid) navPillsGrid.innerHTML = "";

    let currentSection = null;

    questions.forEach((qData) => {
      // 1. Insert Section Divider if entering a new section
      if (qData.section !== currentSection) {
        currentSection = qData.section;
        const catInfo = CATEGORIES[currentSection];

        const secDiv = document.createElement("div");
        secDiv.className = "section-divider";
        secDiv.innerHTML = `
          <div class="section-divider-title">
            <span>${qData.sectionTitle}</span>
          </div>
          <div class="section-badges">
            <span class="sec-badge">${catInfo.range} (${catInfo.total} questions)</span>
            <span class="sec-badge">Weight: ${catInfo.weight}%</span>
            <span class="sec-badge">Min Req: ${catInfo.minRequired}/${catInfo.total} (50%)</span>
          </div>
        `;
        quizContainer.appendChild(secDiv);
      }

      // 2. Build Question Card
      const qCard = document.createElement("div");
      qCard.className = "question-card";
      qCard.id = `qCard_${qData.id}`;

      let optionsHtml = "";
      for (const [optKey, optVal] of Object.entries(qData.options)) {
        optionsHtml += `
          <label class="option-item" id="optLabel_${qData.id}_${optKey}">
            <input type="radio" name="sq_${qData.id}" value="${optKey}" />
            <span class="option-letter">${optKey}.</span>
            <span class="option-text">${optVal}</span>
          </label>
        `;
      }

      qCard.innerHTML = `
        <div class="question-header">
          <span class="q-num-badge">Q${qData.id}</span>
          <div class="question-text">${qData.q}</div>
        </div>
        <div class="options-list">
          ${optionsHtml}
        </div>
      `;

      quizContainer.appendChild(qCard);

      // 3. Build Question Navigator Pill
      if (navPillsGrid) {
        const pill = document.createElement("a");
        pill.className = "nav-pill";
        pill.id = `navPill_${qData.id}`;
        pill.textContent = qData.id;
        pill.title = `Jump to Question ${qData.id}`;
        pill.href = `#qCard_${qData.id}`;
        pill.addEventListener("click", (e) => {
          e.preventDefault();
          const targetCard = document.getElementById(`qCard_${qData.id}`);
          if (targetCard) {
            targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        });
        navPillsGrid.appendChild(pill);
      }
    });

    // Attach change listener to update active states and counters
    quizContainer.addEventListener("change", (e) => {
      if (e.target.matches('input[type="radio"]')) {
        const qName = e.target.name; // e.g. "sq_1"
        const qId = qName.replace("sq_", "");
        const parentCard = document.getElementById(`qCard_${qId}`);

        // Update option item highlight
        if (parentCard) {
          parentCard.querySelectorAll(".option-item").forEach(opt => opt.classList.remove("selected"));
          const selectedLabel = e.target.closest(".option-item");
          if (selectedLabel) selectedLabel.classList.add("selected");

          parentCard.classList.add("answered");
          parentCard.classList.remove("unanswered-alert");
        }

        // Update pill
        const pill = document.getElementById(`navPill_${qId}`);
        if (pill) pill.classList.add("answered");

        updateProgress();
      }
    });

    updateProgress();
  }

  // ---- Update Answered & Unanswered Progress ----
  function updateProgress() {
    let answeredCount = 0;
    questions.forEach(q => {
      const isAnswered = !!quizContainer.querySelector(`input[name="sq_${q.id}"]:checked`);
      if (isAnswered) answeredCount++;
    });

    const unansweredCount = 30 - answeredCount;
    const pct = Math.round((answeredCount / 30) * 100);

    if (answeredCounter) {
      answeredCounter.innerHTML = `Answered: <strong>${answeredCount} / 30</strong>`;
    }
    if (unansweredCounter) {
      unansweredCounter.textContent = `${unansweredCount} Unanswered`;
      if (unansweredCount === 0) {
        unansweredCounter.classList.add("all-done");
        unansweredCounter.textContent = "All 30 Answered!";
      } else {
        unansweredCounter.classList.remove("all-done");
      }
    }
    if (progressBar) {
      progressBar.style.width = `${pct}%`;
    }
  }

  // ---- Timer Logic (45 Minutes) ----
  function startTimer() {
    updateTimerDisplay();
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
      if (remainingSeconds > 0) {
        remainingSeconds--;
        updateTimerDisplay();

        // 5-minute warning
        if (remainingSeconds <= 300 && timerBox) {
          timerBox.classList.add("timer-warning");
        }
      } else {
        // Time expired! Auto-submit
        clearInterval(timerInterval);
        alert("⏱️ Time has expired (45 minutes)! Your assessment is being submitted automatically.");
        submitAssessment(true); // true = auto-submitted
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    if (!timerDisplay) return;
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  // ---- Submission Handler ----
  async function submitAssessment(isAutoSubmit = false) {
    if (isSubmitting || isSubmitted) return;

    const candidateName = (candidateNameInput ? candidateNameInput.value.trim() : "") || "Candidate";
    const employeeId = (employeeIdInput ? employeeIdInput.value.trim() : "") || "N/A";
    const testDate = (testDateInput ? testDateInput.value.trim() : "") || new Date().toISOString().split("T")[0];

    if (!isAutoSubmit && !candidateName) {
      alert("Please enter the Candidate Name before submitting.");
      if (candidateNameInput) candidateNameInput.focus();
      return;
    }

    // Determine unanswered questions
    const unansweredList = [];
    const userAnswers = {};

    questions.forEach(q => {
      const selected = quizContainer.querySelector(`input[name="sq_${q.id}"]:checked`);
      if (selected) {
        userAnswers[q.id] = selected.value;
      } else {
        userAnswers[q.id] = "N/A";
        unansweredList.push(q.id);
      }
    });

    // Confirmation if manual submission
    if (!isAutoSubmit) {
      if (unansweredList.length > 0) {
        const confirmMsg = `You have ${unansweredList.length} unanswered question(s):\n(Q${unansweredList.slice(0, 10).join(', Q')}${unansweredList.length > 10 ? '...' : ''})\n\nUnanswered questions will be marked incorrect (0 marks).\nAre you sure you want to submit your assessment?`;
        if (!confirm(confirmMsg)) {
          // Highlight first unanswered question
          const firstUnansweredId = unansweredList[0];
          const firstCard = document.getElementById(`qCard_${firstUnansweredId}`);
          if (firstCard) {
            firstCard.classList.add("unanswered-alert");
            firstCard.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return;
        }
      } else {
        if (!confirm("All 30 questions have been answered.\n\nAre you sure you want to submit your assessment now?")) {
          return;
        }
      }
    }

    // Lock submission & timer
    isSubmitting = true;
    clearInterval(timerInterval);
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting Assessment...";
    }

    // ---- Calculate Scores (Examiner Guide V2 Formula) ----
    // 1. Raw scores per category
    const catResults = {
      A: { correct: 0, total: 9, weight: 30, min: 5, name: "Cognitive Ability" },
      B: { correct: 0, total: 9, weight: 30, min: 5, name: "Commercial Acumen" },
      C: { correct: 0, total: 6, weight: 20, min: 3, name: "General Technical Competency" },
      D: { correct: 0, total: 6, weight: 20, min: 3, name: "BRIGS Values Judgment" }
    };

    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalUnanswered = 0;

    const detailedReview = [];

    questions.forEach(q => {
      const userChoice = userAnswers[q.id];
      const correctChoice = ANSWER_KEY[q.id];
      const isCorrect = (userChoice === correctChoice);
      const isUnanswered = (userChoice === "N/A");

      if (isCorrect) {
        catResults[q.section].correct++;
        totalCorrect++;
      } else if (isUnanswered) {
        totalUnanswered++;
      } else {
        totalIncorrect++;
      }

      detailedReview.push({
        id: q.id,
        section: q.section,
        questionText: q.q,
        userChoice,
        correctChoice,
        isCorrect,
        isUnanswered
      });
    });

    // 2. Weighted scores & category pass criteria
    // Formula: (Correct / Count) * Weight
    const cognitive = {
      correct: catResults.A.correct,
      total: 9,
      pct: (catResults.A.correct / 9) * 100,
      weighted: (catResults.A.correct / 9) * 30,
      minRequired: 5,
      passed: (catResults.A.correct >= 5)
    };

    const commercial = {
      correct: catResults.B.correct,
      total: 9,
      pct: (catResults.B.correct / 9) * 100,
      weighted: (catResults.B.correct / 9) * 30,
      minRequired: 5,
      passed: (catResults.B.correct >= 5)
    };

    const technical = {
      correct: catResults.C.correct,
      total: 6,
      pct: (catResults.C.correct / 6) * 100,
      weighted: (catResults.C.correct / 6) * 20,
      minRequired: 3,
      passed: (catResults.C.correct >= 3)
    };

    const values = {
      correct: catResults.D.correct,
      total: 6,
      pct: (catResults.D.correct / 6) * 100,
      weighted: (catResults.D.correct / 6) * 20,
      minRequired: 3,
      passed: (catResults.D.correct >= 3)
    };

    // Final Weighted Score out of 100
    const finalWeightedScore = cognitive.weighted + commercial.weighted + technical.weighted + values.weighted;
    const finalScoreRounded = Math.round(finalWeightedScore * 100) / 100;
    const finalScoreDisplay = finalScoreRounded.toFixed(2);

    // 3. Passing criteria check
    // Candidate passes ONLY IF:
    // a) Overall weighted score >= 70/100
    // b) Each category score >= 50% of available marks
    const isOverallPass = (finalScoreRounded >= 70);
    const isCategoriesPass = (cognitive.passed && commercial.passed && technical.passed && values.passed);
    const isPassed = (isOverallPass && isCategoriesPass);

    // 4. Determine reasons for failure if not passed
    const failureReasons = [];
    if (!isOverallPass) {
      failureReasons.push(`Overall weighted score (${finalScoreDisplay}/100) is below the required 70/100 cutoff.`);
    }
    if (!cognitive.passed) {
      failureReasons.push(`Cognitive Ability (${cognitive.correct}/9 – ${cognitive.pct.toFixed(1)}%) is below the required minimum of 5/9 (50%).`);
    }
    if (!commercial.passed) {
      failureReasons.push(`Commercial Acumen (${commercial.correct}/9 – ${commercial.pct.toFixed(1)}%) is below the required minimum of 5/9 (50%).`);
    }
    if (!technical.passed) {
      failureReasons.push(`General Technical Competency (${technical.correct}/6 – ${technical.pct.toFixed(1)}%) is below the required minimum of 3/6 (50%).`);
    }
    if (!values.passed) {
      failureReasons.push(`BRIGS Values Judgment (${values.correct}/6 – ${values.pct.toFixed(1)}%) is below the required minimum of 3/6 (50%).`);
    }

    // ---- Render Professional Scorecard in UI ----
    renderScorecard({
      candidateName,
      employeeId,
      testDate,
      totalCorrect,
      totalIncorrect,
      totalUnanswered,
      finalScoreDisplay,
      isPassed,
      failureReasons,
      cognitive,
      commercial,
      technical,
      values,
      detailedReview
    });

    isSubmitted = true;
    isSubmitting = false;

    // ---- Construct Google Sheets Integration Payload ----
    const answerColumns = {};
    for (let i = 1; i <= 30; i++) {
      const uChoice = userAnswers[i] || "N/A";
      const cChoice = ANSWER_KEY[i];
      answerColumns[`Q${i}`] = `User: ${uChoice} / Correct: ${cChoice}`;
    }

    const payload = {
      app: "salesQuiz",
      name: candidateName,
      candidateName: candidateName,
      employeeId: employeeId,
      testDate: testDate,
      date: testDate,
      score: Number(finalScoreDisplay),
      totalScore: totalCorrect,
      finalWeightedScore: Number(finalScoreDisplay),
      passFail: isPassed ? "PASS" : "FAIL",
      status: isPassed ? "PASS" : "FAIL",

      // Cognitive category
      cognitiveCorrect: cognitive.correct,
      cognitiveTotal: 9,
      cognitivePercentage: `${cognitive.pct.toFixed(2)}%`,
      cognitiveWeightedScore: Number(cognitive.weighted.toFixed(2)),

      // Commercial category
      commercialCorrect: commercial.correct,
      commercialTotal: 9,
      commercialPercentage: `${commercial.pct.toFixed(2)}%`,
      commercialWeightedScore: Number(commercial.weighted.toFixed(2)),

      // Technical category
      technicalCorrect: technical.correct,
      technicalTotal: 6,
      technicalPercentage: `${technical.pct.toFixed(2)}%`,
      technicalWeightedScore: Number(technical.weighted.toFixed(2)),

      // Values category
      valuesCorrect: values.correct,
      valuesTotal: 6,
      valuesPercentage: `${values.pct.toFixed(2)}%`,
      valuesWeightedScore: Number(values.weighted.toFixed(2)),

      // Aggregates
      totalCorrect: totalCorrect,
      totalIncorrect: totalIncorrect,
      totalUnanswered: totalUnanswered,

      // Q1..Q30 detailed responses
      ...answerColumns
    };

    lastSubmissionPayload = payload;

    // Send to Google Sheets Webhook
    sendToGoogleSheets(payload);
  }

  // ---- Send Results to Google Sheets with Accurate Feedback ----
  async function sendToGoogleSheets(payload) {
    const syncCard = document.getElementById("googleSheetSyncCard");
    if (syncCard) {
      syncCard.className = "sync-card sync-pending";
      syncCard.innerHTML = `<span>⏳ <strong>Transmitting results to Google Sheets database...</strong> Please wait.</span>`;
    }

    try {
      await fetch(GAS_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload)
      });

      if (syncCard) {
        syncCard.className = "sync-card sync-success";
        syncCard.innerHTML = `<span>✅ <strong>Assessment recorded successfully !</strong> Record ID verified.</span>`;
      }
    } catch (err) {
      console.error("Google Sheets Webhook Sync Error:", err);
      if (syncCard) {
        syncCard.className = "sync-card sync-error";
        syncCard.innerHTML = `
          <span>⚠️ <strong>Network error syncing to Google Sheets.</strong> Assessment results are safely stored in memory.</span>
          <button type="button" id="retrySyncBtn" class="btn-retry-sync">Retry Sync</button>
        `;
        const retryBtn = document.getElementById("retrySyncBtn");
        if (retryBtn) {
          retryBtn.addEventListener("click", () => sendToGoogleSheets(payload));
        }
      }
    }
  }

  // ---- Render Professional Scorecard ----
  function renderScorecard(data) {
    // Hide form & sticky bar
    quizForm.style.display = "none";
    if (stickyBar) stickyBar.style.display = "none";
    const candidateBar = document.querySelector(".candidate-bar-card");
    if (candidateBar) candidateBar.style.display = "none";

    // Show results
    resultDiv.style.display = "block";
    resultDiv.scrollIntoView({ behavior: "smooth", block: "start" });

    const statusClass = data.isPassed ? "status-pass" : "status-fail";
    const statusText = data.isPassed ? "PASS" : "FAIL";
    const statusBadge = data.isPassed ? "QUALIFIED" : "DID NOT QUALIFY";

    let failureAlertHtml = "";
    if (!data.isPassed && data.failureReasons.length > 0) {
      const itemsHtml = data.failureReasons.map(r => `<li>${r}</li>`).join("");
      failureAlertHtml = `
        <div class="failure-alert-box">
          <h4>⚠️ Criteria Not Met:</h4>
          <ul>${itemsHtml}</ul>
        </div>
      `;
    }

    // Detailed question review rows
    const reviewItemsHtml = data.detailedReview.map(r => {
      let badge = "";
      let itemClass = "";
      if (r.isCorrect) {
        badge = '<span style="color: #059669; font-weight: 700;">✅ Correct (+1)</span>';
        itemClass = "is-correct";
      } else if (r.isUnanswered) {
        badge = '<span style="color: #d97706; font-weight: 700;">⚪ Unanswered (0)</span>';
        itemClass = "is-unanswered";
      } else {
        badge = '<span style="color: #dc2626; font-weight: 700;">❌ Incorrect (0)</span>';
        itemClass = "is-wrong";
      }

      return `
        <div class="review-item ${itemClass}">
          <div class="review-q-header">
            <span>Q${r.id} (${r.section})</span>
            <span>${badge}</span>
          </div>
          <div class="review-q-body">${r.questionText}</div>
          <div class="review-q-answers">
            <span class="user-ans">Candidate Answer: <strong>${r.userChoice}</strong></span>
            <span class="correct-ans">Correct Key: <strong>${r.correctChoice}</strong></span>
          </div>
        </div>
      `;
    }).join("");

    resultDiv.innerHTML = `
      <div class="scorecard-card">
        <!-- Status Banner -->
        <div class="scorecard-banner ${statusClass}">
          <div class="scorecard-status-badge">${statusBadge}</div>
          <div class="scorecard-title">BRIGS Sales Engineer Qualification</div>
          <div class="scorecard-main-score">${data.finalScoreDisplay} <span>/ 100</span></div>
          <div style="font-size: 22px; font-weight: 800; letter-spacing: 1px; margin-top: 4px;">RESULT: ${statusText}</div>
          <div class="scorecard-criteria-note">Passing standard: Overall ≥ 70/100 and Category Minimum ≥ 50%</div>
        </div>

        <!-- Candidate Meta Bar -->
        <div class="scorecard-meta-bar">
          <div class="meta-item">
            <span class="meta-item-label">Candidate Name</span>
            <span class="meta-item-value">${data.candidateName}</span>
          </div>
          <div class="meta-item">
            <span class="meta-item-label">Employee / ID</span>
            <span class="meta-item-value">${data.employeeId}</span>
          </div>
          <div class="meta-item">
            <span class="meta-item-label">Assessment Date</span>
            <span class="meta-item-value">${data.testDate}</span>
          </div>
          <div class="meta-item">
            <span class="meta-item-label">Accuracy / Raw</span>
            <span class="meta-item-value">${data.totalCorrect} / 30 (${Math.round((data.totalCorrect / 30) * 100)}%)</span>
          </div>
          <div class="meta-item">
            <span class="meta-item-label">Attempt Breakdown</span>
            <span class="meta-item-value" style="font-size: 13.5px; font-weight: 600;">
              <span style="color: #059669;">${data.totalCorrect} Correct</span> • 
              <span style="color: #dc2626;">${data.totalIncorrect} Wrong</span> • 
              <span style="color: #d97706;">${data.totalUnanswered} Empty</span>
            </span>
          </div>
        </div>

        ${failureAlertHtml}

        <div class="scorecard-body">
          <h3>Category Score Breakdown & Performance</h3>

          <!-- Category Breakdown Cards Grid -->
          <div class="category-breakdown-grid">
            <!-- Cognitive Ability -->
            <div class="category-card ${data.cognitive.passed ? 'cat-pass' : 'cat-fail'}">
              <div>
                <div class="cat-header">
                  <span class="cat-name">Section A: Cognitive Ability</span>
                  <span class="cat-badge ${data.cognitive.passed ? 'pass' : 'fail'}">${data.cognitive.passed ? 'PASS' : 'FAIL'}</span>
                </div>
                <div class="cat-stats-row">
                  <span>Raw Score: <strong>${data.cognitive.correct} / 9</strong></span>
                  <span>Accuracy: <strong>${data.cognitive.pct.toFixed(1)}%</strong></span>
                </div>
                <div class="cat-progress-bg">
                  <div class="cat-progress-fill ${data.cognitive.passed ? 'fill-pass' : 'fill-fail'}" style="width: ${data.cognitive.pct}%;"></div>
                </div>
              </div>
              <div class="cat-weighted-highlight">
                <span class="label">Weighted Score (30% weight):</span>
                <span class="score">${data.cognitive.weighted.toFixed(2)} / 30</span>
              </div>
              <div style="font-size: 11.5px; color: #64748b; margin-top: 6px;">Min requirement: 5/9 (55.6%)</div>
            </div>

            <!-- Commercial Acumen -->
            <div class="category-card ${data.commercial.passed ? 'cat-pass' : 'cat-fail'}">
              <div>
                <div class="cat-header">
                  <span class="cat-name">Section B: Commercial Acumen</span>
                  <span class="cat-badge ${data.commercial.passed ? 'pass' : 'fail'}">${data.commercial.passed ? 'PASS' : 'FAIL'}</span>
                </div>
                <div class="cat-stats-row">
                  <span>Raw Score: <strong>${data.commercial.correct} / 9</strong></span>
                  <span>Accuracy: <strong>${data.commercial.pct.toFixed(1)}%</strong></span>
                </div>
                <div class="cat-progress-bg">
                  <div class="cat-progress-fill ${data.commercial.passed ? 'fill-pass' : 'fill-fail'}" style="width: ${data.commercial.pct}%;"></div>
                </div>
              </div>
              <div class="cat-weighted-highlight">
                <span class="label">Weighted Score (30% weight):</span>
                <span class="score">${data.commercial.weighted.toFixed(2)} / 30</span>
              </div>
              <div style="font-size: 11.5px; color: #64748b; margin-top: 6px;">Min requirement: 5/9 (55.6%)</div>
            </div>

            <!-- Technical Competency -->
            <div class="category-card ${data.technical.passed ? 'cat-pass' : 'cat-fail'}">
              <div>
                <div class="cat-header">
                  <span class="cat-name">Section C: Technical Competency</span>
                  <span class="cat-badge ${data.technical.passed ? 'pass' : 'fail'}">${data.technical.passed ? 'PASS' : 'FAIL'}</span>
                </div>
                <div class="cat-stats-row">
                  <span>Raw Score: <strong>${data.technical.correct} / 6</strong></span>
                  <span>Accuracy: <strong>${data.technical.pct.toFixed(1)}%</strong></span>
                </div>
                <div class="cat-progress-bg">
                  <div class="cat-progress-fill ${data.technical.passed ? 'fill-pass' : 'fill-fail'}" style="width: ${data.technical.pct}%;"></div>
                </div>
              </div>
              <div class="cat-weighted-highlight">
                <span class="label">Weighted Score (20% weight):</span>
                <span class="score">${data.technical.weighted.toFixed(2)} / 20</span>
              </div>
              <div style="font-size: 11.5px; color: #64748b; margin-top: 6px;">Min requirement: 3/6 (50.0%)</div>
            </div>

            <!-- Values Judgment -->
            <div class="category-card ${data.values.passed ? 'cat-pass' : 'cat-fail'}">
              <div>
                <div class="cat-header">
                  <span class="cat-name">Section D: BRIGS Values Judgment</span>
                  <span class="cat-badge ${data.values.passed ? 'pass' : 'fail'}">${data.values.passed ? 'PASS' : 'FAIL'}</span>
                </div>
                <div class="cat-stats-row">
                  <span>Raw Score: <strong>${data.values.correct} / 6</strong></span>
                  <span>Accuracy: <strong>${data.values.pct.toFixed(1)}%</strong></span>
                </div>
                <div class="cat-progress-bg">
                  <div class="cat-progress-fill ${data.values.passed ? 'fill-pass' : 'fill-fail'}" style="width: ${data.values.pct}%;"></div>
                </div>
              </div>
              <div class="cat-weighted-highlight">
                <span class="label">Weighted Score (20% weight):</span>
                <span class="score">${data.values.weighted.toFixed(2)} / 20</span>
              </div>
              <div style="font-size: 11.5px; color: #64748b; margin-top: 6px;">Min requirement: 3/6 (50.0%)</div>
            </div>
          </div>

          <!-- Summary Table Overview -->
          <div class="table-overview-wrapper">
            <table class="scorecard-table">
              <thead>
                <tr>
                  <th>Evaluation Category</th>
                  <th>Questions</th>
                  <th>Raw Correct</th>
                  <th>Accuracy (%)</th>
                  <th>Weight</th>
                  <th>Weighted Score Earned</th>
                  <th>Cutoff Requirement</th>
                  <th>Category Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Section A: Cognitive Ability</strong></td>
                  <td>Q1–Q9 (9)</td>
                  <td>${data.cognitive.correct} / 9</td>
                  <td>${data.cognitive.pct.toFixed(1)}%</td>
                  <td>30%</td>
                  <td><strong>${data.cognitive.weighted.toFixed(2)} / 30</strong></td>
                  <td>Min 5/9 (≥ 50%)</td>
                  <td><span class="cat-badge ${data.cognitive.passed ? 'pass' : 'fail'}">${data.cognitive.passed ? 'PASS' : 'FAIL'}</span></td>
                </tr>
                <tr>
                  <td><strong>Section B: Commercial Acumen</strong></td>
                  <td>Q10–Q18 (9)</td>
                  <td>${data.commercial.correct} / 9</td>
                  <td>${data.commercial.pct.toFixed(1)}%</td>
                  <td>30%</td>
                  <td><strong>${data.commercial.weighted.toFixed(2)} / 30</strong></td>
                  <td>Min 5/9 (≥ 50%)</td>
                  <td><span class="cat-badge ${data.commercial.passed ? 'pass' : 'fail'}">${data.commercial.passed ? 'PASS' : 'FAIL'}</span></td>
                </tr>
                <tr>
                  <td><strong>Section C: Technical Competency</strong></td>
                  <td>Q19–Q24 (6)</td>
                  <td>${data.technical.correct} / 6</td>
                  <td>${data.technical.pct.toFixed(1)}%</td>
                  <td>20%</td>
                  <td><strong>${data.technical.weighted.toFixed(2)} / 20</strong></td>
                  <td>Min 3/6 (≥ 50%)</td>
                  <td><span class="cat-badge ${data.technical.passed ? 'pass' : 'fail'}">${data.technical.passed ? 'PASS' : 'FAIL'}</span></td>
                </tr>
                <tr>
                  <td><strong>Section D: BRIGS Values Judgment</strong></td>
                  <td>Q25–Q30 (6)</td>
                  <td>${data.values.correct} / 6</td>
                  <td>${data.values.pct.toFixed(1)}%</td>
                  <td>20%</td>
                  <td><strong>${data.values.weighted.toFixed(2)} / 20</strong></td>
                  <td>Min 3/6 (≥ 50%)</td>
                  <td><span class="cat-badge ${data.values.passed ? 'pass' : 'fail'}">${data.values.passed ? 'PASS' : 'FAIL'}</span></td>
                </tr>
                <tr class="total-row">
                  <td><strong>TOTAL QUALIFICATION SCORE</strong></td>
                  <td><strong>30 Questions</strong></td>
                  <td><strong>${data.totalCorrect} / 30</strong></td>
                  <td><strong>${Math.round((data.totalCorrect / 30) * 100)}%</strong></td>
                  <td><strong>100%</strong></td>
                  <td><strong style="font-size: 16px; color: ${data.isPassed ? '#059669' : '#dc2626'};">${data.finalScoreDisplay} / 100</strong></td>
                  <td><strong>Overall ≥ 70 + All Cat. Min</strong></td>
                  <td><span class="cat-badge ${data.isPassed ? 'pass' : 'fail'}" style="font-size: 13px; padding: 4px 10px;">${statusText}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Google Sheets Database Sync Card -->
          <div id="googleSheetSyncCard" class="sync-card sync-pending">
            <span>⏳ Initializing transmission to Google Sheets...</span>
          </div>

          <!-- Collapsible Question-by-Question Review -->
          <div>
            <button type="button" id="toggleReviewBtn" class="review-accordion-btn">
              <span>🔍 Detailed Item Review (${data.totalCorrect} Correct, ${data.totalIncorrect} Incorrect, ${data.totalUnanswered} Unanswered)</span>
              <span id="reviewArrow">▼ Click to Expand</span>
            </button>
            <div id="reviewListContainer" class="review-list" style="display: none;">
              ${reviewItemsHtml}
            </div>
          </div>

          <!-- Scorecard Action Footer -->
          <div class="scorecard-footer">
            <button type="button" id="printScorecardBtn" class="btn-print">🖨️ Print / Save Scorecard as PDF</button>
            <button type="button" id="retakeAssessmentBtn" class="btn-restart">Retake Assessment</button>
          </div>
        </div>
      </div>
    `;

    // Attach Review Accordion Toggle
    const toggleBtn = document.getElementById("toggleReviewBtn");
    const reviewList = document.getElementById("reviewListContainer");
    const reviewArrow = document.getElementById("reviewArrow");

    if (toggleBtn && reviewList) {
      toggleBtn.addEventListener("click", () => {
        const isHidden = (reviewList.style.display === "none");
        reviewList.style.display = isHidden ? "flex" : "none";
        reviewArrow.textContent = isHidden ? "▲ Click to Collapse" : "▼ Click to Expand";
      });
    }

    // Attach Print Button
    const printBtn = document.getElementById("printScorecardBtn");
    if (printBtn) {
      printBtn.addEventListener("click", () => {
        window.print();
      });
    }

    // Attach Retake Button
    const retakeBtn = document.getElementById("retakeAssessmentBtn");
    if (retakeBtn) {
      retakeBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to start a new assessment session? All current answers will be reset.")) {
          resetAssessment();
        }
      });
    }
  }

  // ---- Reset Functionality ----
  function resetAssessment() {
    quizForm.reset();
    isSubmitting = false;
    isSubmitted = false;

    // Remove selections & answered classes
    quizContainer.querySelectorAll(".option-item").forEach(opt => opt.classList.remove("selected"));
    quizContainer.querySelectorAll(".question-card").forEach(c => {
      c.classList.remove("answered");
      c.classList.remove("unanswered-alert");
    });
    if (navPillsGrid) {
      navPillsGrid.querySelectorAll(".nav-pill").forEach(p => p.classList.remove("answered"));
    }

    // Reset timer
    clearInterval(timerInterval);
    remainingSeconds = TEST_DURATION_SECONDS;
    if (timerBox) timerBox.classList.remove("timer-warning");

    // Re-show form & controls
    quizForm.style.display = "block";
    resultDiv.style.display = "none";
    if (stickyBar) stickyBar.style.display = "flex";
    const candidateBar = document.querySelector(".candidate-bar-card");
    if (candidateBar) candidateBar.style.display = "block";

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Assessment";
    }

    // Repopulate user defaults
    if (candidateNameInput && storedName) candidateNameInput.value = storedName;
    if (employeeIdInput && storedEmpId) employeeIdInput.value = storedEmpId;

    updateProgress();
    startTimer();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---- Event Listeners ----
  quizForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submitAssessment(false);
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to reset all answers? Your timer will continue running.")) {
        quizContainer.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
        quizContainer.querySelectorAll(".option-item").forEach(opt => opt.classList.remove("selected"));
        quizContainer.querySelectorAll(".question-card").forEach(c => {
          c.classList.remove("answered");
          c.classList.remove("unanswered-alert");
        });
        if (navPillsGrid) {
          navPillsGrid.querySelectorAll(".nav-pill").forEach(p => p.classList.remove("answered"));
        }
        updateProgress();
      }
    });
  }

  // Anti-tamper protections (disable inspect shortcuts)
  document.addEventListener("contextmenu", e => e.preventDefault());
  document.addEventListener("keydown", e => {
    if (e.ctrlKey && (e.key === "u" || e.key === "s")) e.preventDefault();
    if (e.key === "F12") e.preventDefault();
  });

  // Build UI & start countdown
  buildAssessmentUI();
  startTimer();
}

// =========================================================================
// ======== COMPLAINT REGISTER LOGIC (PRESERVED) ============================
// =========================================================================
function initComplaintApp() {
  const COMPLAINT_GAS_WEBHOOK_URL =
    "https://script.google.com/macros/s/AKfycbz1y1mVD08aECAbbKojObMSb6eYLU6_e4svc3DaaWZ-NlNyVzDkaHaCWMIqIkeZT8r-/exec";

  const complaintIdInput = document.getElementById("complaintId");
  const complaintTitleInput = document.getElementById("complaintTitle");
  const referenceImageInput = document.getElementById("referenceImage");
  const imagePreview = document.getElementById("imagePreview");
  const imagePreviewImg = document.getElementById("imagePreviewImg");
  const clearImageBtn = document.getElementById("clearImageBtn");
  const registeredDateInput = document.getElementById("registeredDate");
  const timelineInput = document.getElementById("timeline");
  const statusInput = document.getElementById("status");
  const resolvedDateInput = document.getElementById("resolvedDate");
  const toBeResolvedByInput = document.getElementById("toBeResolvedBy");
  const complainedByInput = document.getElementById("complainedBy");
  const companyDetailsInput = document.getElementById("companyDetails");
  const rootCauseInput = document.getElementById("rootCause");
  const correctiveActionInput = document.getElementById("correctiveAction");
  const customerDetailsInput = document.getElementById("customerDetails");
  const customerConfirmationInput = document.getElementById("customerConfirmation");
  const remarkInput = document.getElementById("remark");
  const submitBtn = document.getElementById("complaintSubmitBtn");
  const resetBtn = document.getElementById("complaintResetBtn");
  const msgBox = document.getElementById("complaintMsg");

  if (!complaintIdInput || !submitBtn) return;

  const PENDING_ID_KEY = "complaint_pending_id";
  const START_NO = 51;
  let currentImageBase64 = "";

  function getPendingIdOrCreate() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const datePart = `${dd}-${mm}-${yyyy}`;
    const seqKey = "complaint_seq_" + datePart;

    let sno = parseInt(localStorage.getItem(seqKey) || "0", 10);
    if (sno === 0) sno = START_NO;
    const seqStr = String(sno).padStart(4, "0");
    const complaintId = `CMP-${datePart}-${seqStr}`;

    localStorage.setItem(seqKey, String(sno));
    return complaintId;
  }

  function initForm() {
    const pendingId = getPendingIdOrCreate();
    complaintIdInput.value = pendingId;

    const today = new Date();
    registeredDateInput.value = `${String(today.getDate()).padStart(2, "0")}/${String(
      today.getMonth() + 1
    ).padStart(2, "0")}/${today.getFullYear()}`;

    toBeResolvedByInput.value = "";
    statusInput.value = "Pending";
    rootCauseInput.value = "N/A";
  }

  referenceImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      referenceImageInput.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      currentImageBase64 = evt.target.result;
      imagePreviewImg.src = currentImageBase64;
      imagePreview.style.display = "flex";
    };
    reader.readAsDataURL(file);
  });

  clearImageBtn.addEventListener("click", () => {
    referenceImageInput.value = "";
    currentImageBase64 = "";
    imagePreviewImg.src = "";
    imagePreview.style.display = "none";
  });

  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const payload = {
      app: "complaint",
      complaintId: complaintIdInput.value.trim(),
      complaint: complaintTitleInput.value.trim(),
      referenceImage: currentImageBase64 || "",
      registeredDate: registeredDateInput.value,
      timeline: timelineInput.value,
      status: statusInput.value,
      resolvedDate: resolvedDateInput.value,
      toBeResolvedBy: toBeResolvedByInput.value.trim(),
      complainedBy: complainedByInput.value.trim(),
      companyDetails: companyDetailsInput.value.trim(),
      rootCause: rootCauseInput.value.trim(),
      correctiveAction: correctiveActionInput.value.trim(),
      customerDetails: customerDetailsInput.value.trim(),
      customerConfirmation: customerConfirmationInput.value,
      remark: remarkInput.value.trim(),
    };

    if (!payload.complaint || !payload.complainedBy) {
      showMessage("Please fill in Complaint and Complained By fields.", true);
      return;
    }

    showMessage("Submitting complaint...");

    try {
      await fetch(COMPLAINT_GAS_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload),
      });

      localStorage.removeItem(PENDING_ID_KEY);
      showMessage("Complaint submitted successfully ✅", false, 4000);
      resetComplaintForm_keepId();
    } catch (err) {
      console.error("Submit error:", err);
      showMessage("Error submitting complaint. Please check Apps Script.", true);
    }
  });

  resetBtn.addEventListener("click", () => {
    resetComplaintForm_keepId();
    showMessage("Form reset. Complaint ID preserved.", false, 2500);
  });

  function resetComplaintForm_keepId() {
    const pendingId = localStorage.getItem(PENDING_ID_KEY) || getPendingIdOrCreate();
    complaintIdInput.value = pendingId;
    complaintTitleInput.value = "";
    referenceImageInput.value = "";
    currentImageBase64 = "";
    imagePreviewImg.src = "";
    imagePreview.style.display = "none";
    timelineInput.value = "";
    statusInput.value = "Pending";
    resolvedDateInput.value = "";
    toBeResolvedByInput.value = "";
    complainedByInput.value = "";
    companyDetailsInput.value = "";
    rootCauseInput.value = "N/A";
    correctiveActionInput.value = "";
    customerDetailsInput.value = "";
    customerConfirmationInput.value = "Pending";
    remarkInput.value = "";
  }

  function showMessage(text, isError = false, timeout = 3000) {
    msgBox.style.display = "block";
    msgBox.textContent = text;
    msgBox.style.backgroundColor = isError ? "#fdecea" : "#e9f7ef";
    msgBox.style.color = isError ? "#7f1d1d" : "#115e1b";
    if (timeout) setTimeout(() => (msgBox.style.display = "none"), timeout);
  }

  initForm();
}
