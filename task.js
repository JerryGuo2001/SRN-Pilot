const aGraphs = [
    [0,1,0,0,1, 1,0,1,0,0, 0,1,0,1,0, 0,0,1,0,1, 1,0,0,1,0]  // 5x5
];
const bGraphs = [
    [0,1,1,0,0, 1,0,0,1,0, 1,0,0,0,1, 0,1,0,0,1, 0,0,1,1,0]
];

let currentIndex = 0;
let fastCount = 0;
let trialData = [];
let id = "";
let totaltrial=10

function startTask() {
    id = document.getElementById("participantId").value.trim();
    if (!id) return alert("Please enter your ID");
    document.getElementById("instruction").style.display = "none";
    document.getElementById("task").style.display = "block";
    runTrial();
}

function runTrial() {
    if (currentIndex >= totaltrial) {
        document.getElementById("task").style.display = "none";
        document.getElementById("thanks").style.display = "block";
        saveCSV();
        return;
    }

    document.getElementById("warning").style.display = "none";
    document.getElementById("graph-container").style.display = "flex";

    const a = aGraphs[0];
    const b = bGraphs[0];

    drawGraph(a, "graph-left");
    drawGraph(b, "graph-right");

    const trialStart = performance.now();
    let responded = false;

    const keyListener = (e) => {
        if (responded) return;
        if (e.key === "f" || e.key === "j") {
            responded = true;
            const rt = performance.now() - trialStart;
            trialData.push({ id, trial: currentIndex, choice: e.key, rt: Math.round(rt) });
            document.removeEventListener("keydown", keyListener);

            if (rt < 100) {
                fastCount++;
            } else {
                fastCount = 0;
            }

            if (fastCount >= 3) {
                // Hide graphs, show countdown
                document.getElementById("graph-container").style.display = "none";
                let warningElement = document.getElementById("warning");
                let timeLeft = 10;
                warningElement.style.display = "block";
                warningElement.textContent = `⚠️ You're responding too fast! Please slow down. (${timeLeft}s)`;

                const countdown = setInterval(() => {
                    timeLeft--;
                    if (timeLeft > 0) {
                        warningElement.textContent = `⚠️ You're responding too fast! Please slow down. (${timeLeft}s)`;
                    } else {
                        clearInterval(countdown);
                        warningElement.style.display = "none";
                        fastCount = 0;
                        currentIndex++;
                        runTrial();
                    }
                }, 1000);
            } else {
                setTimeout(() => {
                    currentIndex++;
                    runTrial();
                }, 500);
            }
        }
    };

    document.addEventListener("keydown", keyListener);

    setTimeout(() => {
        if (!responded) {
            trialData.push({ id, trial: currentIndex, choice: "none", rt: "timeout" });
            document.removeEventListener("keydown", keyListener);
            currentIndex++;
            runTrial();
        }
    }, 5000);
}


function drawGraph(graphStructure, containerId) {
    const elements = [];
    const size = Math.sqrt(graphStructure.length);

    for (let i = 0; i < size; i++) {
        elements.push({ data: { id: `n${i}` } });
    }

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (graphStructure[i * size + j] === 1) {
                elements.push({ data: { source: `n${i}`, target: `n${j}` } });
            }
        }
    }

    const edgeCount = elements.filter(e => e.data.source && e.data.target).length;
    const nodeCount = size;
    const maxEdges = nodeCount * (nodeCount - 1) / 2;
    const edgeDensity = edgeCount / maxEdges;

    let nodeRepulsion = 250000000;
    if (edgeDensity > 0.75) nodeRepulsion = 100000000;
    else if (edgeDensity > 0.5) nodeRepulsion = 7500000;
    else if (edgeDensity > 0.25) nodeRepulsion = 500000;
    else nodeRepulsion = 250000;

    cytoscape({
        container: document.getElementById(containerId),
        elements: elements,
        style: [
            { selector: 'node', style: { width: '20px', height: '20px', 'background-color': 'blue', label: 'data(id)' }},
            { selector: 'edge', style: { 'line-color': 'gray', width: 2 }}
        ],
        layout: {
            name: 'cose',
            nodeRepulsion: nodeRepulsion,
            idealEdgeLength: 0,
            gravity: 0.25,
            animate: true
        }
    });
}


function saveCSV() {
    const header = "id,trial,choice,rt,graphA,graphB";
    const rows = trialData.map(row => {
        return `${row.id},${row.trial},${row.choice},${row.rt},"${JSON.stringify(aGraphs[0])}","${JSON.stringify(bGraphs[0])}"`;
    });
    const csv = [header, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `data_${id}.csv`;
    link.click();
}

