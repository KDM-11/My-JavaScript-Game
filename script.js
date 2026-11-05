var allLevels = { easy: easy, medium: medium, hard: hard };

var items = easy;     // words for the chosen level
var index = 0;        // which word we are on
var score = 0;        // words right on the first check
var total = 0;        // words checked
var counted = false;  // has this word been scored yet?

var answer = [];      // letters placed, in order
var bank = [];        // letters still in the bank

var dragFrom = "";    // while dragging: "answer" or "bank"
var dragIndex = 0;    // while dragging: position of the letter


function startLevel(level) {
    items = allLevels[level];
    index = 0;
    score = 0;
    total = 0;
    loadWord();
}

function loadWord() {
    var item = items[index];
    var letters = item.word.split("");

    answer = [];
    bank = shuffle(letters);
    while (bank.join("") == item.word) {
        bank = shuffle(letters);
    }
    counted = false;

    document.getElementById("clue").textContent = "";
    document.getElementById("message").textContent = "";
    document.getElementById("answer").className = "box";
    updateStatus();
    drawLetters();
}

function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
    }
    return copy;
}

function updateStatus() {
    document.getElementById("status").textContent =
        "Word " + (index + 1) + " of " + items.length + "  ·  Score " + score + "/" + total;
}


// ---------- drawing ----------

function drawLetters() {
    var answerBox = document.getElementById("answer");
    var bankBox = document.getElementById("bank");
    answerBox.innerHTML = "";
    bankBox.innerHTML = "";

    for (var i = 0; i < answer.length; i++) {
        answerBox.appendChild(makeLetter(answer[i], "answer", i));
    }
    for (var j = 0; j < bank.length; j++) {
        bankBox.appendChild(makeLetter(bank[j], "bank", j));
    }
}

// One letter tile: tap it to move it, or drag it to place it
function makeLetter(text, box, position) {
    var tile = document.createElement("div");
    tile.className = "letter";
    tile.textContent = text;

    tile.onpointerdown = function (event) {
        startPress(event, tile, box, position);
    };
    return tile;
}


// ---------- tap and drag ----------

function startPress(event, tile, box, position) {
    var startX = event.clientX;
    var startY = event.clientY;
    var dragging = false;
    var ghost = null;
    var target = null;   // where it would land: { box, position }

    tile.setPointerCapture(event.pointerId);

    tile.onpointermove = function (e) {
        // only start dragging after a small movement (otherwise it's a tap)
        if (!dragging && Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 8) {
            dragging = true;
            tile.classList.add("lifted");
            ghost = tile.cloneNode(true);
            ghost.className = "letter ghost";
            document.body.appendChild(ghost);
        }
        if (dragging) {
            ghost.style.left = e.clientX + "px";
            ghost.style.top = e.clientY + "px";
            target = findTarget(e.clientX, e.clientY);
            showTarget(target, tile);
        }
    };

    tile.onpointerup = function () {
        tile.onpointermove = null;
        tile.onpointerup = null;
        if (ghost) ghost.remove();

        if (!dragging) {
            tapLetter(box, position);
        } else if (target) {
            dragFrom = box;
            dragIndex = position;
            moveLetter(target.box, target.position);
        } else {
            drawLetters();
        }
    };
}

// Which box is the pointer over, and between which letters?
function findTarget(x, y) {
    var boxes = ["answer", "bank"];
    for (var b = 0; b < boxes.length; b++) {
        var boxEl = document.getElementById(boxes[b]);
        var r = boxEl.getBoundingClientRect();
        if (x > r.left && x < r.right && y > r.top && y < r.bottom) {
            var position = boxEl.children.length;   // default: the end
            for (var i = 0; i < boxEl.children.length; i++) {
                var c = boxEl.children[i].getBoundingClientRect();
                if (y < c.top || (y < c.bottom && x < c.left + c.width / 2)) {
                    position = i;
                    break;
                }
            }
            return { box: boxes[b], position: position };
        }
    }
    return null;
}

// Highlight the box and the letter it will go in front of
function showTarget(target, tile) {
    var marked = document.querySelectorAll(".target, .before");
    for (var i = 0; i < marked.length; i++) {
        marked[i].classList.remove("target", "before");
    }
    if (!target) return;

    var boxEl = document.getElementById(target.box);
    boxEl.classList.add("target");
    var next = boxEl.children[target.position];
    if (next && next != tile) next.classList.add("before");
}

// Tap: bank -> answer, or answer -> bank
function tapLetter(box, position) {
    if (box == "bank") {
        answer.push(bank.splice(position, 1)[0]);
    } else {
        bank.push(answer.splice(position, 1)[0]);
    }
    changed();
}

// Drop: move the dragged letter to a box, at a position
function moveLetter(toBox, toPosition) {
    var fromList = (dragFrom == "answer") ? answer : bank;
    var toList = (toBox == "answer") ? answer : bank;

    var letter = fromList.splice(dragIndex, 1)[0];

    // taking a letter out shifts the ones after it, so adjust
    if (fromList == toList && dragIndex < toPosition) {
        toPosition = toPosition - 1;
    }

    toList.splice(toPosition, 0, letter);
    changed();
}

function changed() {
    document.getElementById("message").textContent = "";
    document.getElementById("answer").className = "box";
    drawLetters();
}


// ---------- buttons ----------

function checkAnswer() {
    var item = items[index];
    var message = document.getElementById("message");

    if (bank.length > 0) {
        message.className = "bad";
        message.textContent = "Place all the letters first.";
        return;
    }

    var isRight = (answer.join("") == item.word);

    // only the first check of each word counts toward the score
    if (!counted) {
        counted = true;
        total = total + 1;
        if (isRight) score = score + 1;
        updateStatus();
    }

    if (isRight) {
        message.className = "good";
        message.textContent = "Correct! Well done.";
        document.getElementById("answer").className = "box right";
    } else {
        message.className = "bad";
        message.textContent = "Not quite. Move the letters around and try again.";
    }
}

function showHint() {
    var item = items[index];
    document.getElementById("clue").textContent =
        item.hint + " · starts with " + item.word[0];
}

function nextWord() {
    index = (index + 1) % items.length;
    loadWord();
}


loadWord();
