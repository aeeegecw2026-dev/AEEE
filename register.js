/* ==========================================================
   Sends the registration form to Google Sheets.
   1. Deploy google-apps-script/Code.gs as a Web App (see USER_MANUAL.md)
   2. Paste the Web App URL below, between the quotes.
   ========================================================== */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx7WGpV9X8b11pN2Ap_TOhBJTOTClgS4u8_Bv40beXFdLNl5Gjf1TYyfQdK3GlG1nRn/exec";

const form = document.getElementById('execom-form');
const statusBox = document.getElementById('form-status');
const submitBtn = document.getElementById('submit-btn');

const rules = {
  fullName: v => v.trim().length >= 3,
  admissionNumber: v => v.trim().length >= 2,
  semester: v => v !== '',
  phone: v => /^[6-9]\d{9}$/.test(v.replace(/[\s-]/g, '')),
  skills: v => v.trim().length >= 5,
  position: v => v !== ''
};

function validateField(name) {
  const input = form.elements[name];
  const ok = rules[name](input.value);
  input.closest('.field').classList.toggle('invalid', !ok);
  return ok;
}

Object.keys(rules).forEach(name => {
  const el = form.elements[name];
  el.addEventListener('blur', () => validateField(name));
  el.addEventListener('input', () => {
    if (el.closest('.field').classList.contains('invalid')) validateField(name);
  });
});

function showStatus(type, message) {
  statusBox.className = 'form-status ' + type;
  statusBox.textContent = message;
  statusBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusBox.className = 'form-status';

  // Spam trap filled in? Pretend success and stop.
  if (form.elements['website'].value) { form.reset(); return; }

  const allValid = Object.keys(rules).map(validateField).every(Boolean);
  if (!allValid) {
    const firstBad = form.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea');
    if (firstBad) firstBad.focus();
    return;
  }

  if (SCRIPT_URL.startsWith('PASTE_')) {
    showStatus('err', 'The form is not connected yet. Add the Google Apps Script Web App URL in js/register.js.');
    return;
  }

  const data = new URLSearchParams({
    fullName: form.elements.fullName.value.trim(),
    admissionNumber: form.elements.admissionNumber.value.trim(),
    semester: form.elements.semester.value,
    phone: form.elements.phone.value.replace(/[\s-]/g, ''),
    skills: form.elements.skills.value.trim(),
    position: form.elements.position.value
  });

  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    // no-cors: the browser cannot read Google's reply, but the data is delivered.
    await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: data });
    form.reset();
    showStatus('ok', 'Registration received. Thank you! We will contact you soon.');
  } catch (err) {
    showStatus('err', 'We could not send your registration. Check your internet connection and try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit registration';
  }
});
