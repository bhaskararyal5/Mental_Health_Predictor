/* ===== Config ===== */
const DEFAULT_API = "http://127.0.0.1:2200";
const getApi = () => (localStorage.getItem("apiUrl") || DEFAULT_API).replace(/\/+$/, "");

const COUNTRIES = ["Afghanistan","Albania","Andorra","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Belarus","Belgium","Bhutan","Bolivia","Bosnia","Brazil","Bulgaria","Canada","Chile","China","Colombia","Costa Rica","Croatia","Cyprus","Czech Republic","Denmark","Ecuador","Egypt","Estonia","Finland","France","Georgia","Germany","Ghana","Greece","Hong Kong","Hungary","Iceland","India","Indonesia","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kosovo","Kuwait","Kyrgyzstan","Latvia","Lebanon","Liechtenstein","Lithuania","Luxembourg","Malaysia","Maldives","Malta","Mexico","Moldova","Monaco","Montenegro","Morocco","Nepal","Netherlands","New Zealand","Nigeria","North Macedonia","Norway","Oman","Pakistan","Panama","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","San Marino","Serbia","Singapore","Slovakia","Slovenia","South Africa","South Korea","Spain","Sri Lanka","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Thailand","Trinidad","Turkey","UAE","UK","USA","Ukraine","Uruguay","Uzbekistan","Vatican City","Venezuela","Vietnam","Yemen","Other"];
const PLATFORMS = ["Instagram","TikTok","YouTube","Facebook","Snapchat","Twitter","WhatsApp","LinkedIn","WeChat","LINE","KakaoTalk","VKontakte"];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const form = $("#predictForm");

/* ===== Populate selects ===== */
$("#Country").innerHTML = COUNTRIES.map(c => `<option${c === "India" ? " selected" : ""}>${c}</option>`).join("");
$("#Most_Used_Platform").innerHTML = PLATFORMS.map(p => `<option>${p}</option>`).join("");

/* ===== Sliders: live value + filled track ===== */
function updateSlider(el) {
  const min = +el.min, max = +el.max, v = +el.value;
  el.style.setProperty("--p", ((v - min) / (max - min)) * 100 + "%");
  const unit = el.dataset.unit;
  $("#o_" + el.id).textContent = `${unit === "hrs" ? v.toFixed(1) : v} ${unit}`;
}
$$('input[type="range"]').forEach(el => {
  updateSlider(el);
  el.addEventListener("input", () => updateSlider(el));
});

/* ===== Segmented buttons ===== */
$$(".seg").forEach(seg => {
  seg.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    $$("button", seg).forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});
const segValue = name => $(`.seg[data-name="${name}"] button.active`).dataset.value;

/* ===== Theme ===== */
const root = document.documentElement;
const savedTheme = localStorage.getItem("theme") ||
  (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
setTheme(savedTheme);
function setTheme(t) {
  root.dataset.theme = t;
  $("#themeToggle").textContent = t === "dark" ? "☀️" : "🌙";
  localStorage.setItem("theme", t);
}
$("#themeToggle").addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));

/* ===== API settings + status ===== */
$("#apiUrl").value = getApi();
$("#apiSave").addEventListener("click", () => {
  localStorage.setItem("apiUrl", $("#apiUrl").value.trim() || DEFAULT_API);
  checkApi();
});
async function checkApi() {
  const s = $("#apiStatus"), t = $("#apiStatusText");
  s.className = "status"; t.textContent = "Checking API…";
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(getApi() + "/", { signal: ctrl.signal });
    if (!r.ok) throw 0;
    s.classList.add("ok"); t.textContent = "API online";
  } catch {
    s.classList.add("off"); t.textContent = "API offline";
  }
}
checkApi();

/* ===== Collect + validate ===== */
function collect() {
  return {
    Age: parseInt($("#Age").value, 10),
    Gender: segValue("Gender"),
    Country: $("#Country").value,
    Academic_Level: $("#Academic_Level").value,
    Most_Used_Platform: $("#Most_Used_Platform").value,
    Purpose_Of_Use: $("#Purpose_Of_Use").value,
    Avg_Daily_Usage_Hours: parseFloat($("#Avg_Daily_Usage_Hours").value),
    Daily_Unlocks: parseInt($("#Daily_Unlocks").value, 10),
    Study_Hours: parseFloat($("#Study_Hours").value),
    Physical_Activity_Hours: parseFloat($("#Physical_Activity_Hours").value),
    Sleep_Hours_Per_Night: parseFloat($("#Sleep_Hours_Per_Night").value),
    Stress_Level: segValue("Stress_Level"),
  };
}
function validate(d) {
  const err = $('[data-for="Age"]'), age = $("#Age");
  const bad = !Number.isInteger(d.Age) || d.Age < 10 || d.Age > 100;
  age.classList.toggle("invalid", bad);
  err.textContent = bad ? "Enter an age between 10 and 100." : "";
  if (bad) return false;

  const total = d.Study_Hours + d.Sleep_Hours_Per_Night + d.Physical_Activity_Hours;
  if (total > 24) {
    showError("Study + sleep + physical activity add up to more than 24 hours a day. Please adjust.");
    return false;
  }
  if (d.Avg_Daily_Usage_Hours + d.Sleep_Hours_Per_Night > 24) {
    showError("Social media usage + sleep exceed 24 hours. Please adjust.");
    return false;
  }
  return true;
}
const showError = msg => { const e = $("#formError"); e.textContent = msg; e.hidden = !msg; };

/* ===== Submit ===== */
form.addEventListener("submit", async e => {
  e.preventDefault();
  showError("");
  const data = collect();
  if (!validate(data)) return;

  setLoading(true);
  try {
    const res = await fetch(getApi() + "/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      let detail = `Server returned ${res.status}.`;
      try {
        const j = await res.json();
        if (Array.isArray(j.detail)) detail = j.detail.map(d => `${d.loc.slice(-1)}: ${d.msg}`).join(" · ");
        else if (j.detail) detail = j.detail;
      } catch {}
      throw new Error(detail);
    }
    const json = await res.json();
    showResult(json.predicted_mental_health_score, data);
    $("#apiStatus").className = "status ok"; $("#apiStatusText").textContent = "API online";
  } catch (err) {
    const offline = err instanceof TypeError;
    showError(offline
      ? `Couldn't reach the API at ${getApi()}. Make sure FastAPI is running (uvicorn main:app --reload).`
      : err.message);
    if (offline) { $("#apiStatus").className = "status off"; $("#apiStatusText").textContent = "API offline"; }
  } finally {
    setLoading(false);
  }
});

function setLoading(on) {
  $("#submitBtn").disabled = on;
  $(".spinner").hidden = !on;
  $(".btn-label").textContent = on ? "Predicting…" : "Predict score";
}

/* ===== Result rendering ===== */
const CIRC = 2 * Math.PI * 86;
function showResult(score, d) {
  $("#placeholder").hidden = true;
  $("#result").hidden = false;

  const pct = Math.max(0, Math.min(score / 10, 1));
  const ring = $("#ring");
  ring.style.strokeDasharray = CIRC;
  ring.style.strokeDashoffset = CIRC;
  requestAnimationFrame(() => requestAnimationFrame(() => (ring.style.strokeDashoffset = CIRC * (1 - pct))));

  let level, cls, color, text;
  if (score >= 7)      { level = "Good well-being";   cls = "good"; color = "var(--good)"; text = "The profile suggests a healthy balance between social media use and daily life."; }
  else if (score >= 5) { level = "Moderate";          cls = "mid";  color = "var(--warn)"; text = "A fairly average outlook, with some habits that could be improved."; }
  else                 { level = "Needs attention";   cls = "low";  color = "var(--bad)";  text = "This profile suggests elevated risk. Small lifestyle changes may help."; }
  ring.style.stroke = color;
  const badge = $("#badge");
  badge.className = "badge " + cls;
  badge.textContent = level;
  $("#summary").textContent = text;

  animateNumber($("#scoreNum"), score);
  renderInsights(d);
  if (window.innerWidth <= 920) $("#resultCard").scrollIntoView({ behavior: "smooth", block: "start" });
}

function animateNumber(el, target) {
  const start = performance.now(), dur = 1100;
  (function tick(now) {
    const t = Math.min((now - start) / dur, 1), eased = 1 - Math.pow(1 - t, 3);
    el.textContent = (target * eased).toFixed(1);
    if (t < 1) requestAnimationFrame(tick); else el.textContent = target.toFixed(2);
  })(start);
}

function renderInsights(d) {
  const tips = [];
  if (d.Sleep_Hours_Per_Night < 6) tips.push(["😴", `Sleep is low (${d.Sleep_Hours_Per_Night.toFixed(1)} h). Aim for 7–9 hours.`]);
  else if (d.Sleep_Hours_Per_Night >= 7) tips.push(["✅", `Healthy sleep of ${d.Sleep_Hours_Per_Night.toFixed(1)} h per night.`]);

  if (d.Avg_Daily_Usage_Hours >= 6) tips.push(["📱", `Heavy social media use (${d.Avg_Daily_Usage_Hours.toFixed(1)} h/day). Try screen-time limits.`]);
  else if (d.Avg_Daily_Usage_Hours <= 3) tips.push(["✅", "Moderate social media usage."]);

  if (d.Daily_Unlocks > 200) tips.push(["🔓", `${d.Daily_Unlocks} unlocks a day suggests frequent phone checking.`]);

  if (d.Physical_Activity_Hours < 1) tips.push(["🏃", "Very little physical activity. Even a daily walk helps."]);
  else if (d.Physical_Activity_Hours >= 2) tips.push(["✅", "Good level of physical activity."]);

  if (d.Stress_Level === "High" || d.Stress_Level === "Very High")
    tips.push(["🧘", `${d.Stress_Level} stress is one of the strongest signals. Consider relaxation and support.`]);
  else if (d.Stress_Level === "Low") tips.push(["✅", "Low stress is a strong positive factor."]);

  if (!tips.length) tips.push(["ℹ️", "Your habits sit close to the average student profile."]);

  $("#insights").innerHTML = tips.slice(0, 5)
    .map(([i, t], n) => `<li style="animation-delay:${n * 80}ms"><span>${i}</span><span>${t}</span></li>`).join("");
}

/* ===== Reset ===== */
$("#resetBtn").addEventListener("click", () => {
  form.reset();
  $("#Country").value = "India";
  $$(".seg").forEach(seg => {
    $$("button", seg).forEach(b => b.classList.remove("active"));
    const def = seg.dataset.name === "Gender" ? "Male" : "Medium";
    $(`button[data-value="${def}"]`, seg).classList.add("active");
  });
  $$('input[type="range"]').forEach(updateSlider);
  $("#Age").classList.remove("invalid");
  $('[data-for="Age"]').textContent = "";
  showError("");
  $("#result").hidden = true;
  $("#placeholder").hidden = false;
});
