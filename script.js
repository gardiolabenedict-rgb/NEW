// --- Event Listeners ---
document.getElementById("loadAndRunBtn").addEventListener("click", () => {
    const type = document.querySelector('input[name="automatonType"]:checked').value;
    
    const cleanSplit = (id) => document.getElementById(id).value
        .split(",")
        .map(s => s.trim())
        .filter(s => s !== "");

    const states = cleanSplit("statesInput");
    const alphabet = cleanSplit("alphabetInput");
    const startState = document.getElementById("startStateInput").value.trim();
    const acceptStates = cleanSplit("acceptStatesInput");
    const transitionsText = document.getElementById("transitionsInput").value.trim();
    const inputString = document.getElementById("stringInput").value.trim();

    const transitions = parseTransitions(transitionsText, type);
    renderTransitionTable(transitions, alphabet, states, type);
    drawAutomaton(states, acceptStates, startState, transitions, type);

    const traceOutput = [];
    const result = simulateAutomaton(type, states, alphabet, startState, acceptStates, transitions, inputString, traceOutput);

    const resultDiv = document.getElementById("simulationResult");
    resultDiv.innerHTML = `<strong>${result ? "✅ Input Accepted" : "❌ Input Rejected"}</strong>\n\n${traceOutput.join("\n")}`;
});

document.getElementById("resetBtn").addEventListener("click", () => {
    document.getElementById("simulationResult").innerText = "";
    document.getElementById("transitionTable").innerHTML = "";
    const canvas = document.getElementById("automatonCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// --- Helper Functions ---
function parseTransitions(input, type) {
    const transitions = {};
    const rules = input.split(";");
    rules.forEach((rule) => {
        if (!rule.trim() || !rule.includes("->")) return;
        const [left, right] = rule.split("->");
        const [from, symbol] = left.trim().split(",");
        const toStates = right.trim().split(",").map(s => s.trim());
        if (!transitions[from]) transitions[from] = {};
        if (type === "DFA") {
            transitions[from][symbol] = toStates[0];
        } else {
            if (!transitions[from][symbol]) transitions[from][symbol] = [];
            transitions[from][symbol].push(...toStates);
        }
    });
    return transitions;
}

function renderTransitionTable(transitions, alphabet, states, type) {
    const table = document.getElementById("transitionTable");
    table.innerHTML = "";
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `<th>State</th>` + alphabet.map(sym => `<th>${sym}</th>`).join("");
    table.appendChild(headerRow);
    states.forEach(state => {
        const row = document.createElement("tr");
        let html = `<td><strong>${state}</strong></td>`;
        alphabet.forEach(symbol => {
            const val = transitions[state]?.[symbol];
            html += `<td>${Array.isArray(val) ? `{${val.join(", ")}}` : (val || "-")}</td>`;
        });
        row.innerHTML = html;
        table.appendChild(row);
    });
}

function drawAutomaton(states, acceptStates, startState, transitions, type) {
    const canvas = document.getElementById("automatonCanvas");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const positions = {};
    const radius = 25;
    states.forEach((state, i) => {
        const angle = (i / states.length) * 2 * Math.PI;
        positions[state] = { x: 300 + 120 * Math.cos(angle), y: 175 + 120 * Math.sin(angle) };
    });

    for (const from in transitions) {
        for (const symbol in transitions[from]) {
            const dests = Array.isArray(transitions[from][symbol]) ? transitions[from][symbol] : [transitions[from][symbol]];
            dests.forEach(to => {
                const p1 = positions[from], p2 = positions[to];
                if (!p1 || !p2) return;
                ctx.beginPath();
                if (from === to) {
                    ctx.arc(p1.x, p1.y - radius, 15, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillText(symbol, p1.x, p1.y - radius - 20);
                } else {
                    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                    ctx.moveTo(p1.x + radius * Math.cos(angle), p1.y + radius * Math.sin(angle));
                    ctx.lineTo(p2.x - radius * Math.cos(angle), p2.y - radius * Math.sin(angle));
                    ctx.stroke();
                    ctx.fillText(symbol, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 10);
                }
            });
        }
    }

    states.forEach(state => {
        const {x, y} = positions[state];
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = (state === startState) ? "#f1c40f" : "#fff";
        ctx.fill();
        ctx.stroke();
        if (acceptStates.includes(state)) { ctx.beginPath(); ctx.arc(x, y, radius - 4, 0, Math.PI * 2); ctx.stroke(); }
        ctx.fillStyle = "#000";
        ctx.fillText(state, x, y + 5);
    });
}

function simulateAutomaton(type, states, alphabet, start, accepts, transitions, input, trace) {
    if (type === "DFA") {
        let current = start;
        trace.push(`START ➔ ${current}`);
        for (const char of input) {
            const next = transitions[current]?.[char];
            if (!next) return false;
            trace.push(`${current} --(${char})--> ${next}`);
            current = next;
        }
        return accepts.includes(current);
    } 
    if (type === "NFA") {
        const visited = new Set();
        function dfs(curr, idx, path) {
            if (visited.has(`${curr}-${idx}`)) return false;
            visited.add(`${curr}-${idx}`);
            if (idx === input.length) {
                if (accepts.includes(curr)) { trace.push(...path, `DONE: ${curr}`); return true; }
                return false;
            }
            const nextStates = transitions[curr]?.[input[idx]] || [];
            for (const next of nextStates) {
                if (dfs(next, idx + 1, [...path, `${curr} --(${input[idx]})--> ${next}`])) return true;
            }
            return false;
        }
        return dfs(start, 0, []);
    }
    return false;
}