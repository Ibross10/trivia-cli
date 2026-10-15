
const readline = require("node:readline");
const { performance } = require("node:perf_hooks");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

const GAME_TIME = 60;

const questions = [
    {
        question: "What is the capital city of Kenya?",
        options: ["A. Kampala", "B. Nairobi", "C. Dodoma", "D. Kigali"],
        answer: "B"
    },
    {
        question: "Which language runs in a web browser?",
        options: ["A. Python", "B. C++", "C. JavaScript", "D. Java"],
        answer: "C"
    },
    {
        question: "What does CPU stand for?",
        options: [
            "A. Central Processing Unit",
            "B. Computer Personal Unit",
            "C. Central Program Utility",
            "D. Control Processing User"
        ],
        answer: "A"
    },
    {
        question: "Which of these is an input device?",
        options: ["A. Monitor", "B. Speaker", "C. Printer", "D. Keyboard"],
        answer: "D"
    },
    {
        question: "What does HTML stand for?",
        options: [
            "A. Hyper Trainer Marking Language",
            "B. HyperText Markup Language",
            "C. HighText Machine Language",
            "D. HyperText Markdown Language"
        ],
        answer: "B"
    },
    {
        question: "Which symbol creates a single-line comment in JavaScript?",
        options: ["A. <!-- -->", "B. **", "C. //", "D. ##"],
        answer: "C"
    },
    {
        question: "Which keyword declares a variable that can be reassigned?",
        options: ["A. let", "B. constant", "C. fixed", "D. define"],
        answer: "A"
    },
    {
        question: "Which array method creates a new array by transforming elements?",
        options: ["A. filter()", "B. map()", "C. push()", "D. pop()"],
        answer: "B"
    },
    {
        question: "Which data type represents true or false?",
        options: ["A. String", "B. Number", "C. Boolean", "D. Array"],
        answer: "C"
    },
    {
        question: "Which Node.js module helps read terminal input?",
        options: ["A. readline", "B. http", "C. path", "D. os"],
        answer: "A"
    }
];

let score = 0;
let correctAnswers = 0;
let incorrectAnswers = 0;
let gameEnded = false;
let timer = null;
let deadline = 0;
let activePrompt = null;
let pendingAnswer = null;
const results = [];

// Display the prompt and the countdown on one terminal line.
function renderPrompt() {
    if (activePrompt === null) return;

    const remaining = deadline
        ? Math.max(0, Math.ceil((deadline - performance.now()) / 1000))
        : null;

    const timerText = remaining !== null
        ? `Time remaining: ${remaining} seconds | `
        : "";

    process.stdout.write(
        `\r\x1b[2K${timerText}${activePrompt}${rl.line}`
    );
}

// Read terminal input without letting the timer create extra lines.
function ask(promptText) {
    return new Promise((resolve) => {
        activePrompt = promptText;
        pendingAnswer = resolve;
        renderPrompt();
    });
}

rl.on("line", (input) => {
    if (pendingAnswer) {
        const resolve = pendingAnswer;
        pendingAnswer = null;
        activePrompt = null;
        resolve(input);
    }
});

function startGame() {
    console.log("\n================================");
    console.log("       TRIVIA CHALLENGE");
    console.log("================================");
    console.log("Welcome to the Trivia CLI!");
    console.log(`You have ${GAME_TIME} seconds to answer.`);
    console.log("Enter A, B, C, or D to answer.");
    console.log("Enter Q to quit the game.");
}

function startTimer() {
    deadline = performance.now() + GAME_TIME * 1000;

    timer = setInterval(() => {
        if (performance.now() >= deadline) {
            gameEnded = true;
            clearInterval(timer);

            activePrompt = null;
            process.stdout.write("\r\x1b[2K");

            console.log("Time is up!");

            if (pendingAnswer) {
                const resolve = pendingAnswer;
                pendingAnswer = null;
                resolve(null);
            }

            return;
        }

        // Refresh only the current prompt line.
        if (activePrompt !== null) {
            renderPrompt();
        }
    }, 250);
}

async function askQuestion(item, index) {
    while (!gameEnded) {
        if (performance.now() >= deadline) {
            gameEnded = true;
            return false;
        }

        console.log(`\nQuestion ${index + 1} of ${questions.length}`);
        console.log(item.question);

        item.options.forEach((option) => console.log(option));

        const answer = await ask("Your answer (A/B/C/D): ");

        if (answer === null) {
            gameEnded = true;
            return false;
        }

        if (performance.now() >= deadline) {
            gameEnded = true;
            return false;
        }

        const normalizedAnswer = answer.trim().toUpperCase();

        if (normalizedAnswer === "Q") {
            gameEnded = true;
            console.log("\nYou chose to quit.");
            return false;
        }

        if (!["A", "B", "C", "D"].includes(normalizedAnswer)) {
            console.log("Invalid answer! Enter A, B, C, or D.");
            continue;
        }

        const isCorrect = normalizedAnswer === item.answer;

        if (isCorrect) {
            console.log("Correct! Well done.");
            score++;
            correctAnswers++;
        } else {
            console.log(`Incorrect! The correct answer is ${item.answer}.`);
            incorrectAnswers++;
        }

        results.push({
            question: item.question,
            userAnswer: normalizedAnswer,
            correctAnswer: item.answer,
            isCorrect: isCorrect
        });

        return true;
    }

    return false;
}

function showResults() {
    console.log("\n================================");
    console.log("          GAME OVER");
    console.log("================================");
    console.log(`Questions answered: ${results.length}`);
    console.log(`Correct answers: ${correctAnswers}`);
    console.log(`Incorrect answers: ${incorrectAnswers}`);
    console.log(`Final score: ${score}/${questions.length}`);

    const accuracy = results.length === 0
        ? 0
        : Math.round((correctAnswers / results.length) * 100);

    console.log(`Accuracy: ${accuracy}%`);
    console.log(
        `Correct results recorded: ${results.filter(r => r.isCorrect).length}`
    );

    if (accuracy >= 80) {
        console.log("Excellent work!");
    } else if (accuracy >= 50) {
        console.log("Good effort! Keep practicing.");
    } else {
        console.log("Keep learning. You can improve!");
    }
}

async function playGame() {
    try {
        startGame();

        const ready = await ask("\nPress ENTER to start the quiz: ");

        if (ready === null) {
            console.log("Game cancelled.");
            return;
        }

        score = 0;
        correctAnswers = 0;
        incorrectAnswers = 0;
        results.length = 0;
        gameEnded = false;

        startTimer();

        for (let i = 0; i < questions.length; i++) {
            if (gameEnded) break;

            const answered = await askQuestion(questions[i], i);

            if (!answered && gameEnded) break;
        }

        clearInterval(timer);

        if (!gameEnded && results.length === questions.length) {
            console.log("\nCongratulations! You completed the quiz!");
        }

        showResults();
    } catch (error) {
        clearInterval(timer);
        console.error("\nAn error occurred:", error.message);
    } finally {
        clearInterval(timer);
        activePrompt = null;
        rl.close();
    }
}

playGame();
