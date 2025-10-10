document.addEventListener("DOMContentLoaded", () => {
    // ======== TAB SWITCHING LOGIC ========
    const tabLinks = document.querySelectorAll(".tab-link");
    const tabContents = document.querySelectorAll(".tab-content");

    tabLinks.forEach(link => {
        link.addEventListener("click", () => {
            const targetTab = link.dataset.tab;
            tabLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");
            tabContents.forEach(content => {
                content.classList.toggle("active", content.id === targetTab);
            });
        });
    });

    // ======== INITIALIZE ALL APPS ========
    initCertificateApp();
    initSalesQuizApp();
    initInterviewQuiz();
});

// ======== CERTIFICATE GENERATOR APP LOGIC ========
function initCertificateApp() {
    // --- Elements ---
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

    let dataSubmitted = false;
    const GAS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz6UZzsz4BwYHWPWo6Nmr2bH-CYpFbkjTpzygQU0cq-CUaZjMKUJUGfkvS2oW8Fqv9GrA/exec"; 

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
        const downloadBtn = downloadImgBtn; // Simplified as there's only one download button
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
    document.getElementById('crtResetBtn').addEventListener('click', resetForm);
    updatePreview();
}

// ======== SALES SKILLS QUIZ APP LOGIC ========
function initSalesQuizApp() {
    const GAS_WEBHOOK_URL ="https://script.google.com/macros/s/AKfycbz6UZzsz4BwYHWPWo6Nmr2bH-CYpFbkjTpzygQU0cq-CUaZjMKUJUGfkvS2oW8Fqv9GrA/exec"; 
    const questions = [
        {"q":"When starting to generate leads, what’s your first priority?","answer":"A","options":{"A":"Building a target list","B":"Leveraging referrals","C":"Using digital tools","D":"Attending events"}},
        {"q":"How would you begin a cold call?","answer":"D","options":{"A":"Quickly share benefits","B":"Understand needs/challenges","C":"Introduce company","D":"Connect on recent expansion"}},
        {"q":"When evaluating if someone is a strong prospect:","answer":"A","options":{"A":"Look for decision-making authority","B":"Check budget","C":"Assess urgency","D":"Consider long-term relationship"}},
        {"q":"If a prospect says, “Your price is too high,” what’s your response?","answer":"A","options":{"A":"Show the value and ROI","B":"Ask about their budget","C":"Customize a package","D":"Mention other clients felt the same"}},
        {"q":"What’s the most important factor when submitting an offer?","answer":"D","options":{"A":"Breakdown of features","B":"Competitive pricing","C":"Client success stories","D":"Personalizing to the client’s problem"}},
        {"q":"During tough negotiations, your style is:","answer":"A","options":{"A":"Find a win-win solution","B":"Hold firm on value","C":"Use silence and patience","D":"Offer small concessions"}},
        {"q":"Your go-to closing technique is:","answer":"B","options":{"A":"Direct close","B":"Choice close","C":"Urgency close","D":"Assumptive close"}},
        {"q":"If a client delays payment, how do you respond?","answer":"A","options":{"A":"Politely remind and resend invoice","B":"Call to explain importance","C":"Offer installment plan","D":"Escalate diplomatically"}},
        {"q":"How often do you follow up with a non-responsive lead?","answer":"C","options":{"A":"Weekly until reply","B":"Every few days","C":"Once in 2 weeks with value","D":"Only with new offers"}},
        {"q":"To connect quickly with a new client:","answer":"B","options":{"A":"Find common interests","B":"Show genuine curiosity in their business","C":"Share a relevant success story","D":"Use humor"}},
        {"q":"You have 100 leads but only 10 hours to work. How do you prioritize?","answer":"C","options":{"A":"By highest revenue potential","B":"By readiness","C":"By referral/warmth of connection","D":"By ease of conversion"}},
        {"q":"If your product doesn’t fully meet client’s needs:","answer":"D","options":{"A":"Recommend partners","B":"Focus on what it does solve","C":"Suggest phased implementation","D":"Honestly state limitations"}},
        {"q":"If a client says “No”:","answer":"A","options":{"A":"Ask for feedback on why","B":"Leave door open","C":"Request referral","D":"Move on immediately"}},
        {"q":"Which data point helps you most in decision making?","answer":"A","options":{"A":"Conversion rate of past leads","B":"Customer feedback & NPS","C":"Average sales cycle length","D":"Payment history"}},
        {"q":"AI flags a lead as “High Potential” but your gut says “Not likely.” What do you do?","answer":"C","options":{"A":"Trust AI insights","B":"Trust experience","C":"Blend both - test with small effort","D":"Check with manager"}}
    ];

    const quizForm = document.getElementById("salesQuizForm");
    const quizContainer = document.getElementById("salesQuizContainer");
    const resultDiv = document.getElementById("salesResult");

    // helper: shuffle array in-place (Fisher–Yates)
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Build quiz dynamically and set data-marks for each option
    function buildQuiz() {
        quizContainer.innerHTML = "";
        questions.forEach((qData, idx) => {
            const qDiv = document.createElement("div");
            qDiv.className = "question";
            qDiv.innerHTML = `<h3>Q${idx + 1}. ${qData.q}</h3>`;

            // prepare marks for non-correct options
            const nonCorrectMarks = shuffle([10, 15, 20]); // randomized assignment
            let ncIndex = 0;

            for (const [key, val] of Object.entries(qData.options)) {
                const optLabel = document.createElement("label");
                optLabel.className = "option";

                // determine marks: correct gets 40, others get random 10/15/20
                let marks = 0;
                if (key === qData.answer) {
                    marks = 40;
                } else {
                    marks = nonCorrectMarks[ncIndex++];
                }

                optLabel.innerHTML = `
                    <input type="radio" name="sq${idx}" value="${key}" data-marks="${marks}" />
                    <span>${key}. ${val}</span>
                `;
                qDiv.appendChild(optLabel);
            }

            quizContainer.appendChild(qDiv);
        });
    }

    // Handle form submission
    quizForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("salesName").value.trim();
        const employeeId = document.getElementById("salesEmployeeId").value.trim();

        if (!name || !employeeId) {
            alert("Please fill in your Name and Employee ID.");
            return;
        }

        let totalScore = 0;
        const perQuestionResults = [];

        questions.forEach((qData, idx) => {
            const selected = quizContainer.querySelector(`input[name="sq${idx}"]:checked`);
            const userChoice = selected ? selected.value : null;
            const marks = selected ? parseInt(selected.getAttribute("data-marks") || "0", 10) : 0;
            totalScore += marks;

            perQuestionResults.push({
                qIndex: idx + 1,
                question: qData.q,
                correct: qData.answer,
                userChoice,
                marksAwarded: marks,
                correctText: qData.options[qData.answer],
                userText: userChoice ? qData.options[userChoice] : null
            });
        });

        // show summary & per-question breakdown
        resultDiv.style.display = "block";
        let html = `<h2>Your Total Score: ${totalScore}</h2>`;
        html += `<p>Correct answer = 40 marks. Other options were randomly assigned 10 / 15 / 20 for each question.</p>`;
        html += `<hr />`;
        html += `<div class="breakdown">`;

        perQuestionResults.forEach(r => {
            const correctBadge = (r.userChoice === r.correct) ? '✅ Correct' : '❌ Wrong';
            html += `<div class="q-result">
                        <strong>Q${r.qIndex}.</strong> ${r.question}<br/>
                        Your answer: <em>${r.userChoice ? r.userChoice + '. ' + r.userText : '<span style="color:gray">No answer</span>'}</em><br/>
                        Correct answer: <em>${r.correct}. ${r.correctText}</em><br/>
                        Marks awarded: <strong>${r.marksAwarded}</strong> — ${correctBadge}
                     </div><hr/>`;
        });

        html += `</div>`;
        resultDiv.innerHTML = html;

        // Save to Google Sheet
        try {
            await fetch(GAS_WEBHOOK_URL, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify({
                    app: "salesQuiz",
                    name,
                    employeeId,
                    score: totalScore,
                    details: perQuestionResults
                })
            });
            resultDiv.innerHTML += `<p>✅ Result saved successfully.</p>`;
        } catch (err) {
            console.error("Error saving result:", err);
            resultDiv.innerHTML += `<p>⚠️ Could not save result.</p>`;
        }
    });


    // Reset Quiz
    document.getElementById("salesQuizResetBtn").addEventListener("click", () => {
        quizForm.reset();
        resultDiv.style.display = "none";
    });

    buildQuiz();
}

// ======== INTERVIEW QUIZ APP LOGIC ========
// ======== INTERVIEW QUIZ APP LOGIC ========
function initInterviewQuiz() {
    const GAS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbz6UZzsz4BwYHWPWo6Nmr2bH-CYpFbkjTpzygQU0cq-CUaZjMKUJUGfkvS2oW8Fqv9GrA/exec";

    const questions = [
        {"q": "If a salesperson sells 5 units of a product at Rs20 each and offers a 10% discount, what is the total revenue?", "answer": "B", "options": {"A": "90", "B": "95", "C": "100", "D": "110"}},
        {"q": "If a company’s cost price is 50 and it is sold at a 20% profit, what is the selling price?", "answer": "A", "options": {"A": "60", "B": "70", "C": "80", "D": "90"}},
        {"q": "A company offers a 10% discount on products priced at 150 each. If a customer buys 3 products, how much is the total discount?", "answer": "B", "options": {"A": "40.50", "B": "45", "C": "50.50", "D": "55"}},
        {"q": "A salesperson must meet a target of 5000 in sales. If they achieve only 4000, what is the shortfall in percentage?", "answer": "C", "options": {"A": "10%", "B": "15%", "C": "20%", "D": "25%"}},
        {"q": "A lead funnel drops 50% of leads at each stage. If you start with 800 leads, how many remain after 3 stages?", "answer": "A", "options": {"A": "100", "B": "200", "C": "150", "D": "120"}},
        {"q": "A region contributes 40% of total sales. If total sales are ₹5,00,000, what is the contribution from that region?", "answer": "A", "options": {"A": "₹2,00,000", "B": "₹2,50,000", "C": "₹2,20,000", "D": "₹2,10,000"}},
        {"q": "Complete the analogy: Prospect : Conversion :: Inquiry : ?", "answer": "D", "options": {"A": "Sale", "B": "Proposal", "C": "Engagement", "D": "Closure"}},
        {"q": "A client orders 12 units at ₹3,200 each with a 5% volume discount. What’s the total invoice amount before tax?", "answer": "B", "options": {"A": "₹38,400", "B": "₹36,480", "C": "₹34,560", "D": "₹35,200"}},
        {"q": "A salesperson closes 4 deals every 6 days. How many deals will they close in 30 days?", "answer": "B", "options": {"A": "18", "B": "20", "C": "24", "D": "25"}},
        {"q": "A customer orders 100 helmets at Rs30 each, with a 5% discount on orders above 50 units. What is the total price?", "answer": "A", "options": {"A": "Rs 2,850", "B": "Rs 2,950", "C": "Rs 3,000", "D": "Rs 3,100"}},
        {"q": "A company's sales target is Rs10,000. Month 1 sales are $6,200, Month 2 are $3,000. What is the target for Month 3?", "answer": "C", "options": {"A": "Rs 800", "B": "Rs 1,000", "C": "Rs 1,200", "D": "Rs 1,500"}},
        {"q": "A buyer is interested but keeps delaying the final decision. What is the most effective way to close the deal?", "answer": "C", "options": {"A": "Apply pressure with a limited offer", "B": "Walk away from the deal", "C": "Understand the reason for delay and address it", "D": "Offer a bigger discount"}},
        {"q": "If a project you quoted gets delayed by your internal team, how do you communicate this to the client?", "answer": "C", "options": {"A": "Don’t mention it", "B": "Blame the operations team", "C": "Communicate transparently and give revised timelines", "D": "Apologize and offer a refund"}},
        {"q": "You realize the solution offered is not 100% suitable for the customer. What do you do?", "answer": "B", "options": {"A": "Sell it anyway", "B": "Recommend a customized version even if it reduces margin", "C": "Cancel the deal", "D": "Offer additional support post-sale"}},
        {"q": "A company sells 200 units of safety equipment at $50 per unit. Can the total revenue be calculated?", "answer": "A", "options": {"A": "Sufficient", "B": "Insufficient"}},
        {"q": "A product costs $75 and sells for $120. Is the profit percentage greater than 30%?", "answer": "A", "options": {"A": "Sufficient", "B": "Insufficient"}},
        {"q": "A team has a goal to sell 500 units and has sold 250 so far. Can we determine if they will meet the target?", "answer": "B", "options": {"A": "Sufficient", "B": "Insufficient"}},
        {"q": "A customer orders 6 units of a product worth $100 each. A 10% discount is offered on orders above $500. Is the discount applicable?", "answer": "A", "options": {"A": "Sufficient", "B": "Insufficient"}},
        {"q": "A safety helmet costs $20 and is sold at a 25% profit. Can the selling price be calculated?", "answer": "A", "options": {"A": "Sufficient", "B": "Insufficient"}},
        {"q": "A client mistakenly pays ₹50,000 extra. Your team is short on targets. What do you do?", "answer": "C", "options": {"A": "Keep the money for targets", "B": "Hold until the client notices", "C": "Immediately inform and refund", "D": "Adjust against future bills"}},
        {"q": "A teammate suggests an unconventional but untested approach. How do you respond?", "answer": "B", "options": {"A": "Reject it to avoid risk", "B": "Ask for details and suggest testing it together", "C": "Insist on proven methods", "D": "Let them handle it alone"}},
        {"q": "A client blames your product for an accident, but data proves misuse. How do you approach it?", "answer": "C", "options": {"A": "Aggressively deny responsibility", "B": "Blame the client directly", "C": "Calmly explain the facts and offer support", "D": "Let legal handle it"}},
        {"q": "A teammate is struggling with a sale in an area you have experience in. What do you do?", "answer": "B", "options": {"A": "Wait to be asked", "B": "Offer to help and suggest a joint meeting", "C": "Ignore it, focus on your clients", "D": "Point out their failure to your manager"}},
        {"q": "A client wants an untested feature to close a sale. What do you do?", "answer": "B", "options": {"A": "Promise it and figure it out later", "B": "Honestly explain it's in development and share alternatives", "C": "Offer a workaround without discussing risks", "D": "Avoid the question"}},
        {"q": "A long-term client is struggling financially and delays payments. What’s your response?", "answer": "B", "options": {"A": "Suspend service immediately", "B": "Suggest payment plans and ensure essential support", "C": "Ignore them until payment is made", "D": "Escalate without understanding"}},
        {"q": "You discover a minor, rare flaw in a new solution. Do you disclose it during the pitch?", "answer": "B", "options": {"A": "Hide it since it's minor", "B": "Disclose it and explain mitigation steps", "C": "Wait for someone to notice", "D": "Blame the technical team"}},
        {"q": "A new team member is shy and hesitant to share ideas. You:", "answer": "B", "options": {"A": "Ignore it", "B": "Privately encourage them and offer support", "C": "Make jokes to break the ice", "D": "Tell them to speak up"}},
        {"q": "Your product pitch is outdated but still working. You:", "answer": "C", "options": {"A": "Stick to what works", "B": "Ask your manager for ideas", "C": "Propose and test a new pitch", "D": "Wait for competitors to innovate"}},
        {"q": "A teammate makes a mistake during a demo and blames you. You:", "answer": "C", "options": {"A": "Let it go to avoid conflict", "B": "Call them out in front of the client", "C": "Speak privately and clarify the facts", "D": "Blame them back"}},
        {"q": "A client has unique safety concerns not in your catalog. You:", "answer": "B", "options": {"A": "Say no, it doesn't exist", "B": "Listen carefully and suggest customized options", "C": "Tell them to adjust expectations", "D": "Delay answering"}},
        {"q": "You made an error in a quote costing the company ₹5,000. The client is unaware. What do you do?", "answer": "B", "options": {"A": "Let it pass", "B": "Inform your manager and the client to correct it", "C": "Quietly cover the difference", "D": "Blame a junior team member"}},
        {"q": "You must leave a team presentation for an emergency. You:", "answer": "B", "options": {"A": "Cancel the meeting", "B": "Brief a teammate thoroughly to take over", "C": "Leave without informing anyone", "D": "Email an excuse"}},
        {"q": "A junior proposes an impractical idea. You:", "answer": "B", "options": {"A": "Dismiss it quickly", "B": "Acknowledge and explore how to refine it", "C": "Tell them not to waste time", "D": "Say nothing and move on"}},
        {"q": "You're behind on follow-ups and a client emails for an update. You:", "answer": "B", "options": {"A": "Ignore the mail until ready", "B": "Apologize and give a realistic timeline", "C": "Blame the backend team", "D": "Promise an unrealistic delivery"}},
        {"q": "A team member is overwhelmed but not asking for help. Your response?", "answer": "B", "options": {"A": "Wait for them to speak up", "B": "Offer help and suggest dividing tasks", "C": "Report them for inefficiency", "D": "Ignore it to avoid extra work"}},
        {"q": "A client misinterprets your advice and takes a wrong safety step. You:", "answer": "B", "options": {"A": "Blame them for not understanding", "B": "Admit it could’ve been clearer and work to fix it", "C": "Say it’s not your fault", "D": "Avoid the topic"}},
        {"q": "You’ve been asked to suggest cost-saving ideas for clients. You:", "answer": "B", "options": {"A": "Recommend what you always do", "B": "Analyze usage patterns and suggest new models", "C": "Suggest random reductions", "D": "Avoid it to save time"}},
        {"q": "During a project debrief, you realize your minor error affected team results. You:", "answer": "B", "options": {"A": "Keep quiet", "B": "Admit your mistake and suggest improvements", "C": "Blame the process", "D": "Downplay it"}},
        {"q": "A factory manager says your product is hard for older workers to use. You:", "answer": "B", "options": {"A": "Thank them and send a manual", "B": "Listen and propose a user-friendly version", "C": "Say they need to train workers better", "D": "Tell them there’s no other option"}}
    ];

    const quizForm = document.getElementById("interviewQuizForm");
    const quizContainer = document.getElementById("interviewQuizContainer");
    const resultDiv = document.getElementById("interviewResult");

    function buildQuiz() {
        quizContainer.innerHTML = "";
        questions.forEach((qData, idx) => {
            const qDiv = document.createElement("div");
            qDiv.className = "question";
            qDiv.innerHTML = `<h3>Q${idx + 1}. ${qData.q}</h3>`;

            for (const [key, val] of Object.entries(qData.options)) {
                const optLabel = document.createElement("label");
                optLabel.className = "option";
                optLabel.innerHTML = `
                    <input type="radio" name="iq${idx}" value="${key}" />
                    <span>${key}. ${val}</span>
                `;
                qDiv.appendChild(optLabel);
            }
            quizContainer.appendChild(qDiv);
        });
    }

    quizForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        
        const name = document.getElementById("interviewName").value.trim();
        const employeeId = document.getElementById("interviewEmployeeId").value.trim(); // Corrected ID and variable
        const location = document.getElementById("location").value.trim();

        if (!name || !employeeId) { // This now works correctly
            alert("Please fill in your Name and Employee ID.");
            return;
        }

        let totalScore = 0;
        const perQuestionResults = [];

        questions.forEach((qData, idx) => {
            const selected = quizContainer.querySelector(`input[name="iq${idx}"]:checked`);
            const userChoice = selected ? selected.value : null;
            const correct = userChoice === qData.answer;

            if (correct) totalScore += 1; // existing 1-mark scoring

            perQuestionResults.push({
                qIndex: idx + 1,
                question: qData.q,
                correct: qData.answer,
                userChoice,
                correctText: qData.options[qData.answer],
                userText: userChoice ? qData.options[userChoice] : null,
                isCorrect: correct
            });
        });

        // Display result
        resultDiv.style.display = "block";
        let html = `<h2>Your Total Score: ${totalScore} / ${questions.length}</h2>`;
        html += `<p>✅ Correct = 1 mark | ❌ Wrong = 0 marks</p><hr/>`;

        perQuestionResults.forEach(r => {
            const badge = r.isCorrect ? '✅ Correct' : '❌ Wrong';
            html += `<div class="q-result">
                        <strong>Q${r.qIndex}.</strong> ${r.question}<br/>
                        Your answer: <em>${r.userChoice ? r.userChoice + '. ' + r.userText : '<span style="color:gray">No answer</span>'}</em><br/>
                        Correct answer: <em>${r.correct}. ${r.correctText}</em><br/>
                        ${badge}
                     </div><hr/>`;
        });

        resultDiv.innerHTML = html;

        // Save to Google Sheet
        try {
            await fetch(GAS_WEBHOOK_URL, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify({
                    app: "interviewQuiz",
                    name,
                    employeeId,
                    location,
                    score: totalScore,
                    details: perQuestionResults
                })
            });
            resultDiv.innerHTML += `<p>✅ Result saved successfully.</p>`;
        } catch (err) {
            console.error("Error saving result:", err);
            resultDiv.innerHTML += `<p>⚠️ Could not save result.</p>`;
        }
    });

    document.getElementById("interviewQuizResetBtn").addEventListener("click", () => {
        quizForm.reset();
        resultDiv.style.display = "none";
    });

    buildQuiz();
}

