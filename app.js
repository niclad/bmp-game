/** @type {number} The total number of events captured */
let totalEvents = 0;

/** @type {?Date} The time of the last event */
let currentTime = null;

/** @type {number[]} The BPM from the current user */
const bpmValues = [];

/** @type {boolean} Should display the accuracy */
let showAccuracy = false;

/** @type {?number} The target BPM to aim for */
let targetBPM = null;

// Element ID constants
const BPM_COUNT_ID = 'bpm-count';
const AVG_ROW_ID = 'avg-row';
const AVG_BPM_ID = 'bpm-avg';
const ACC_ROW_ID = 'acc-row';
const ACC_BPM_ID = 'bpm-acc';
const SET_TARGET_ID = 'set-target';
const TARGET_FIELD_ID = 'target-bpm';
const SETTINGS_ID = 'settings';
const RESET_ID = 'reset';

/**
 * Capture user input to calculate the BPM
 * @param {Event} _ The event captured. This value doesn't matter as
 * we only care that something occurred and not why.
 */
function calcBPM(_) {
    totalEvents++;

    // calculate the BPM
    if (!currentTime) {
        currentTime = new Date();
        return;
    }
    const newTime = new Date();
    const timeDiff = newTime - currentTime;
    currentTime = newTime;
    const bpm = Math.round(60000 / timeDiff);
    bpmValues.push(bpm);

    // calculate the average BPM
    let avg = null;
    if (bpmValues.length > 5) {
        avg = Math.round(rollingAverage());
    }

    // calculate the accuracy
    let acc = null;
    if (targetBPM && bpm) {
        acc = Math.round(calculateAccuracy(bpm));
    }

    updateContent(bpm, avg, acc);
}

/**
 * Calculate the rolling average of the BPM values
 * @returns {number} [max=5] The rolling average of the BPM values
 */
function rollingAverage(max = 5) {
    const values = bpmValues.slice(-max);
    return values.reduce((acc, val) => acc + val, 0) / values.length;
}

/**
 * Calculate the accuracy of the BPM values
 * @param {number} bpm The cucrrent BPM result
 * @returns {number} The accuracy of the BPM values
 */
function calculateAccuracy(bpm) {
    const error = Math.abs(targetBPM - bpm) / targetBPM;
    const scaledError = Math.min(1, Math.max(0, error));

    return (1 - scaledError) * 100;
}

/**
 * Update the content visible on the page
 * @param {number} bpm BPM value to display
 * @param {?number} avg The average BPM value to display
 * @param {?number} acc The accuracy value to display
 */
function updateContent(bpm, avg, acc) {
    console.debug('BPM:', bpm, 'Average:', avg, 'Accuracy:', acc);
    // update the BPM count
    const bpmElement = document.getElementById(BPM_COUNT_ID);
    bpmElement.textContent = bpm < 1 ? "<1" : bpm;

    // update the average BPM
    if (avg === null || acc === undefined) return;

    const avgRowElement = document.getElementById(AVG_ROW_ID);
    avgRowElement.style.opacity = "1";

    const avgElement = document.getElementById(AVG_BPM_ID);
    avgElement.textContent = avg;

    // update the accuracy
    if (acc === null || acc === undefined) return;
    const accRowElement = document.getElementById('acc-row');
    if (showAccuracy) {
        // show the accuracy
        accRowElement.style.opacity = "1";
    } else {
        // don't show the accuracy
        accRowElement.style.opacity = "0";
    }

    const accElement = document.getElementById(ACC_BPM_ID);
    accElement.textContent = acc;
}

document.addEventListener('keydown', calcBPM);
// left clicks
document.addEventListener('click', calcBPM);
// right clicks
document.addEventListener('contextmenu', calcBPM);

// Handle setting the target BPM
const setTarget = document.getElementById(SET_TARGET_ID);
const bpmField = document.getElementById(TARGET_FIELD_ID);

// load the target BPM from local storage
document.addEventListener('DOMContentLoaded', () => {
    const accuracy = localStorage.getItem('showAccuracy');
    if (accuracy) {
        showAccuracy = accuracy === 'true';
        setTarget.checked = showAccuracy;
    }

    toggleTarget(showAccuracy);

    const target = localStorage.getItem('targetBPM');
    if (target) {
        targetBPM = parseInt(target, 10);
        bpmField.value = targetBPM;
    }
});

/**
 * Toggle the target BPM field
 * @param {boolean} checked Checkbox event 
 */
function toggleTarget(checked) {
    console.debug('Show accuracy:', checked);
    showAccuracy = checked;

    const accRowElement = document.getElementById(ACC_ROW_ID);

    // set target BPM field visibility
    if (checked) {
        bpmField.removeAttribute('disabled');
            bpmField.style.opacity = "1";
    } else {
        bpmField.setAttribute('disabled', 'true');
        bpmField.style.opacity = "0";
        accRowElement.style.opacity = "0";
    }
}

setTarget.addEventListener('click', (ev) => {
    console.debug('Setting target:', setTarget.checked);
    ev.stopPropagation();
    const { checked } = setTarget;
    toggleTarget(checked);
});

// handle the target BPM value
bpmField.addEventListener('change', (ev) => {
    ev.stopPropagation();
    const { value } = bpmField;

    // don't accept values less than 1
    if (value < 1) {
        return;
    }

    targetBPM = parseInt(value, 10);

    // store the target BPM in local storage
    localStorage.setItem('targetBPM', targetBPM);
    localStorage.setItem('showAccuracy', showAccuracy);
});

bpmField.addEventListener('keydown', (ev) => ev.stopPropagation());

// don't allow clicks on the settings box to bubble up
document.getElementById(SETTINGS_ID).addEventListener('click', (ev) => ev.stopPropagation());
document.getElementById(SETTINGS_ID).addEventListener('contextmenu', (ev) => ev.stopPropagation());

/**
 * Reset the DOM elements
 */
function resetDOM() {
    const bpmElement = document.getElementById(BPM_COUNT_ID);
    bpmElement.textContent = 0;

    const avgRowElement = document.getElementById(AVG_ROW_ID);
    avgRowElement.style.opacity = "0";

    const accRowElement = document.getElementById(ACC_ROW_ID);
    accRowElement.style.opacity = "0";
}

/**
 * Reset the whole application
 */
function reset() {
    const defaultValues = {
        totalEvents: 0,
        currentTime: null,
        bpmValues: [],
        showAccuracy: false,
        targetBPM: null
    };

    // clear the local storage
    localStorage.clear();

    // reset the values
    totalEvents = defaultValues.totalEvents;
    currentTime = defaultValues.currentTime;
    bpmValues.length = defaultValues.bpmValues.length;
    showAccuracy = defaultValues.showAccuracy;
    targetBPM = defaultValues.targetBPM;

    // reset the DOM elements
    resetDOM();

    // reset the settings
    setTarget.checked = showAccuracy;
    toggleTarget(showAccuracy);
    bpmField.value = '';
}

// handle the reset button
document.getElementById(RESET_ID).addEventListener('click', reset);

