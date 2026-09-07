// ===== BUSINESS OPERATING COMPANION =====

// ===== DAY TRACKING =====

const today = new Date().toDateString();

const lastOpened =
    localStorage.getItem("lastOpened");

localStorage.setItem("lastOpened", today);

// Store all important things
let commitments =
    JSON.parse(localStorage.getItem("commitments")) || [];
    
    function saveCommitments(){

    localStorage.setItem(
        "commitments",
        JSON.stringify(commitments)
    );

}

// Get elements
const addButton = document.getElementById("addButton");
const captureModal = document.getElementById("captureModal");
const captureInput = document.getElementById("captureInput");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const taskList = document.getElementById("taskList");
const reminderSelect =    document.getElementById("reminderSelect");
const reminderArea =
document.getElementById("reminderArea");

const reminderList =  document.getElementById("reminderList");

// Edit modal
const editModal =
    document.getElementById("editModal");

const editInput =
    document.getElementById("editInput");

const editCancelButton =
    document.getElementById("editCancelButton");

const editSaveButton =
    document.getElementById("editSaveButton");

// Delete modal
const deleteModal =
    document.getElementById("deleteModal");

const deleteMessage =
    document.getElementById("deleteMessage");

const deleteCancelButton =
    document.getElementById("deleteCancelButton");

const deleteConfirmButton =
    document.getElementById("deleteConfirmButton");

let editingIndex = null;
let deletingIndex = null;
let expandedIndex = null;

// Open capture screen
addButton.addEventListener("click", () => {
    captureModal.classList.remove("hidden");
    captureInput.focus();
});

// Close capture screen
cancelButton.addEventListener("click", () => {

    captureModal.classList.add("hidden");

    captureInput.value = "";

    reminderSelect.value = "none";
});

// Save item
saveButton.addEventListener("click", () => {

    const text = captureInput.value.trim();

    if (text === "") return;

    let reminderAt = null;

if (reminderSelect.value === "tomorrow") {

    const tomorrow = new Date();

    tomorrow.setDate(
        tomorrow.getDate() + 1
    );

    reminderAt = tomorrow
        .toISOString()
        .split("T")[0];
}

commitments.push({
    text: text,
    completed: false,
    createdAt: new Date().toISOString(),
    reminderAt: reminderAt
});
    
    saveCommitments();

    renderList();

    captureInput.value = "";

reminderSelect.value = "none";

captureModal.classList.add("hidden");

});

// Draw everything
function renderList() {

    taskList.innerHTML = "";

    if (commitments.length === 0) {

        taskList.innerHTML = `
        <div class="empty-state">
            <h2>Nothing important yet.</h2>
            <p>
                Tap the + button when something is worth remembering.
            </p>
        </div>
        `;

        showDueReminders();

        return;
    }


    // ===== SMART ORDERING =====

    const sortedCommitments = commitments
        .map((item, index) => ({ item, index }))
        .sort((a, b) => {

            const itemA = a.item;
            const itemB = b.item;

            // 1. Completed items always go to the bottom
            if (itemA.completed !== itemB.completed) {
                return itemA.completed ? 1 : -1;
            }

            // 2. Unfinished items with a reminder for today
            // stay ahead of future reminders
            const today =
                new Date().toISOString().split("T")[0];

            const todayReminderA =
                !itemA.completed &&
                itemA.reminderAt === today;

            const todayReminderB =
                !itemB.completed &&
                itemB.reminderAt === today;

            if (todayReminderA !== todayReminderB) {
                return todayReminderA ? -1 : 1;
            }


            // 3. Unfinished items without a reminder
            // stay before future scheduled reminders
            const noReminderA =
                !itemA.completed &&
                !itemA.reminderAt;

            const noReminderB =
                !itemB.completed &&
                !itemB.reminderAt;

            if (noReminderA !== noReminderB) {
                return noReminderA ? -1 : 1;
            }


            // 4. Future reminders
            // remain after ordinary unfinished items
            const futureReminderA =
                !itemA.completed &&
                itemA.reminderAt &&
                itemA.reminderAt > today;

            const futureReminderB =
                !itemB.completed &&
                itemB.reminderAt &&
                itemB.reminderAt > today;

            if (futureReminderA !== futureReminderB) {
                return futureReminderA ? 1 : -1;
            }


            // 5. Older items remain before newer ones
            const createdA = itemA.createdAt || "";
            const createdB = itemB.createdAt || "";

            return createdA.localeCompare(createdB);
        });


// ===== CREATE TASK CARDS =====

sortedCommitments.forEach(({ item, index }) => {

    const today =
        new Date().toISOString().split("T")[0];

    let reminderLabel = "";

    // Completed items receive NO reminder label
    if (!item.completed) {

        if (
            item.reminderAt &&
            item.reminderAt <= today
        ) {

            reminderLabel = "Due today";

        } else if (
            item.reminderAt &&
            item.reminderAt > today
        ) {

            reminderLabel = "Tomorrow";
        }
    }

    const task = document.createElement("div");

    task.className = item.completed
        ? "task completed"
        : "task";

    if (expandedIndex === index) {
        task.classList.add("expanded");
    }

    task.innerHTML = `
        <div class="task-content">

            <input
                type="checkbox"
                ${item.completed ? "checked" : ""}
                onchange="toggleComplete(${index})">

            <span class="task-text">
                ${item.text}
            </span>

            ${
                reminderLabel
                    ? `<span class="reminder-label">
                        ${reminderLabel}
                       </span>`
                    : ""
            }

        </div>

        <div class="task-actions">

            <button
                class="edit-button"
                onclick="editCommitment(${index})">
                Edit
            </button>

            <button
                class="delete-button"
                onclick="deleteCommitment(${index})">
                Delete
            </button>

        </div>
    `;

    task.addEventListener("click", (event) => {

        // Don't expand/collapse when interacting
        // with the checkbox or action buttons.
        if (
            event.target.closest("input") ||
            event.target.closest("button")
        ) {
            return;
        }

        if (expandedIndex === index) {

            expandedIndex = null;

        } else {

            expandedIndex = index;

        }

        renderList();
    });

    taskList.appendChild(task);

});

}

function checkReminders() {

    const todayDate = new Date()
        .toISOString()
        .split("T")[0];

    const dueReminders = commitments.filter(item => {

        return (
            !item.completed &&
            item.reminderAt &&
            item.reminderAt <= todayDate
        );

    });

    return dueReminders;
}

function showDueReminders() {

    const dueReminders = checkReminders();

    if (dueReminders.length === 0) {

        reminderArea.classList.add("hidden");
        reminderList.innerHTML = "";

        return;
    }

    reminderArea.classList.remove("hidden");

    reminderList.innerHTML = "";

    dueReminders.forEach(item => {

        const reminder = document.createElement("div");

        reminder.className = "reminder-item";

        reminder.innerHTML = `
            <span class="reminder-icon">🔔</span>
            <span>${item.text}</span>
        `;

        reminderList.appendChild(reminder);

    });
}

// Complete item
function toggleComplete(index) {

    commitments[index].completed =
        !commitments[index].completed;
        saveCommitments();

    renderList();

  showDueReminders();

}

function editCommitment(index) {

    editingIndex = index;

    editInput.value =
        commitments[index].text;

    editModal.classList.remove("hidden");

    editInput.focus();
}

editCancelButton.addEventListener("click", () => {

    editModal.classList.add("hidden");

    editInput.value = "";

    editingIndex = null;
});


editSaveButton.addEventListener("click", () => {

    if (editingIndex === null) {
        return;
    }

    const trimmedText =
        editInput.value.trim();

    if (trimmedText === "") {
        return;
    }

    commitments[editingIndex].text =
        trimmedText;

    saveCommitments();

    renderList();

    editModal.classList.add("hidden");

    editInput.value = "";

    editingIndex = null;
});

function deleteCommitment(index) {

    deletingIndex = index;

    deleteMessage.textContent =
        `Are you sure you want to delete "${commitments[index].text}"?`;

    deleteModal.classList.remove("hidden");
}

deleteCancelButton.addEventListener("click", () => {

    deleteModal.classList.add("hidden");

    deletingIndex = null;
});


deleteConfirmButton.addEventListener("click", () => {

    if (deletingIndex === null) {
        return;
    }

    commitments.splice(deletingIndex, 1);

    saveCommitments();

    renderList();

    deleteModal.classList.add("hidden");

    deletingIndex = null;
});

// First render
renderList();
showDueReminders();
