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
    const GAS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycby6cBw7KGNyUIZ0RdLT4jgAi8TJ-hJFKFbPlQcFCNcvdUY66oF7NP8bbWSdEebKafU2OQ/exec"; 

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
    const GAS_WEBHOOK_URL ="https://script.google.com/macros/s/AKfycby6cBw7KGNyUIZ0RdLT4jgAi8TJ-hJFKFbPlQcFCNcvdUY66oF7NP8bbWSdEebKafU2OQ/exec"; 
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

    // Disable right click & key inspect
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && (e.key === 'c' || e.key === 'u' || e.key === 's')) e.preventDefault();
        if (e.key === 'F12') e.preventDefault();
    });


    buildQuiz();
}


