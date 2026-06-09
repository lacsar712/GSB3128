// ===== Toast & Modal =====
function toast(msg, type = 'info', dur = 3000) { const c = document.getElementById('toastContainer'); const t = document.createElement('div'); t.className = `toast toast-${type}`; t.innerHTML = `<i class="ri-${type === 'success' ? 'check' : 'error' ? 'error-warning' : type === 'warning' ? 'alert' : 'information'}-line"></i><span>${msg}</span><span class="toast-close" onclick="this.parentElement.remove()">&times;</span>`; c.appendChild(t); setTimeout(() => { t.style.animation = 'slideOut .3s ease forwards'; setTimeout(() => t.remove(), 300) }, dur) }
let modalResolve = null;
function openModal(title, body, footer, cls = '') { const o = document.getElementById('modalOverlay'), b = document.getElementById('modalBox'), t = document.getElementById('modalTitle'), bd = document.getElementById('modalBody'), ft = document.getElementById('modalFooter'); t.textContent = title; bd.innerHTML = body; ft.innerHTML = footer || ''; b.className = 'modal ' + (cls || ''); o.classList.add('show') }
function closeModal() { document.getElementById('modalOverlay').classList.remove('show'); if (modalResolve) modalResolve(null) }
function confirmModal(title, msg) { return new Promise(resolve => { modalResolve = resolve; openModal(title, `<p style="font-size:14px;color:var(--text2)">${msg}</p>`, `<button class="btn btn-outline" onclick="closeModal();modalResolve&&modalResolve(false)">取消</button><button class="btn btn-primary" onclick="closeModal();modalResolve&&modalResolve(true)">确认</button>`) }) }
document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal() })

// ===== API Helper =====
async function api(url, opts = {}) { try { const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined }); return await r.json() } catch (e) { toast('请求失败: ' + e.message, 'error'); return null } }

// ===== Navigation =====
const navItems = document.querySelectorAll('.nav-item');
const titles = { 'dashboard': '数据概览', 'exercises': 'Python练习', 'projects': '实践项目', 'questions': '测试题库', 'selenium': 'Selenium课程', 'ide': '云端编程', 'exams': '考试管理' };
navItems.forEach(item => item.addEventListener('click', () => { const sec = item.dataset.section; navItems.forEach(n => n.classList.remove('active')); item.classList.add('active'); document.querySelectorAll('.section').forEach(s => s.classList.remove('active')); document.getElementById('sec-' + sec).classList.add('active'); document.getElementById('pageTitle').textContent = titles[sec] || sec; if (sec === 'dashboard') loadDashboard(); else if (sec === 'exercises') loadExercises(); else if (sec === 'projects') loadProjects(); else if (sec === 'questions') loadQuestions(); else if (sec === 'selenium') loadSelenium(); else if (sec === 'exams') loadExams() }));

// ===== Time =====
function updateTime() { const now = new Date(); document.getElementById('currentTime').textContent = now.toLocaleString('zh-CN') }
setInterval(updateTime, 1000); updateTime();

// ===== Dashboard =====
async function loadDashboard() {
  const s = await api('/api/stats'); if (!s) return;
  const el = document.getElementById('sec-dashboard');
  el.innerHTML = `
  <div class="stat-cards">
    <div class="stat-card"><div class="num">${s.exercises.total}</div><div class="label">Python练习题</div><div style="font-size:12px;color:var(--text3);margin-top:4px">编程题 ${s.exercises.programming} | 选择题 ${s.exercises.choice}</div></div>
    <div class="stat-card"><div class="num">${s.questions.total}</div><div class="label">测试题库题目</div><div style="font-size:12px;color:var(--text3);margin-top:4px">主观题 ${s.questions.subjective} | 客观题 ${s.questions.objective}</div></div>
    <div class="stat-card"><div class="num">${s.projects.practice + s.projects.course_design}</div><div class="label">实践项目</div><div style="font-size:12px;color:var(--text3);margin-top:4px">实践 ${s.projects.practice} | 课设 ${s.projects.course_design}</div></div>
    <div class="stat-card"><div class="num">${s.selenium.videos}</div><div class="label">教学视频</div><div style="font-size:12px;color:var(--text3);margin-top:4px">${s.selenium.chapters} 个章节</div></div>
    <div class="stat-card"><div class="num">${s.exams}</div><div class="label">考试数量</div></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
    <div class="card"><h3 class="section-title"><i class="ri-pie-chart-line"></i>Python练习分布</h3>
      <div class="bar-chart" id="exChart"></div></div>
    <div class="card"><h3 class="section-title"><i class="ri-bar-chart-2-line"></i>测试题库分布</h3>
      <div class="bar-chart" id="qChart"></div></div>
  </div>
  <div class="card" style="margin-top:16px"><h3 class="section-title"><i class="ri-rocket-2-line"></i>快速入口</h3>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px">
      <button class="btn btn-primary btn-lg" onclick="navTo('exercises')"><i class="ri-code-s-slash-line"></i> Python练习</button>
      <button class="btn btn-success btn-lg" onclick="navTo('projects')"><i class="ri-folder-chart-line"></i> 实践项目</button>
      <button class="btn btn-outline btn-lg" onclick="navTo('questions')"><i class="ri-questionnaire-line"></i> 测试题库</button>
      <button class="btn btn-outline btn-lg" onclick="navTo('selenium')"><i class="ri-robot-2-line"></i> Selenium课程</button>
      <button class="btn btn-outline btn-lg" onclick="navTo('ide')"><i class="ri-terminal-box-line"></i> 云端编程</button>
      <button class="btn btn-outline btn-lg" onclick="navTo('exams')"><i class="ri-file-list-3-line"></i> 考试管理</button>
    </div>
  </div>`;
  // Simple bar charts
  const exData = await api('/api/exercises?size=999');
  if (exData) {
    const cats = {}; exData.data.forEach(e => { cats[e.category] = (cats[e.category] || 0) + 1 });
    const ch = document.getElementById('exChart'); ch.innerHTML = ''; const max = Math.max(...Object.values(cats));
    Object.entries(cats).forEach(([k, v]) => { const bar = document.createElement('div'); bar.className = 'bar'; bar.style.height = `${v / max * 140}px`; bar.title = `${k}: ${v}题`; bar.innerHTML = `<span class="bar-label">${k.slice(0, 3)}</span>`; ch.appendChild(bar) })
  }
  const qData = await api('/api/questions?size=999');
  if (qData) {
    const types = {}; qData.data.forEach(q => { const tl = typeLabel(q.type); types[tl] = (types[tl] || 0) + 1 });
    const ch = document.getElementById('qChart'); ch.innerHTML = ''; const max = Math.max(...Object.values(types));
    Object.entries(types).forEach(([k, v]) => { const bar = document.createElement('div'); bar.className = 'bar'; bar.style.height = `${v / max * 140}px`; bar.title = `${k}: ${v}题`; bar.innerHTML = `<span class="bar-label">${k}</span>`; ch.appendChild(bar) })
  }
  // Sidebar stats
  document.getElementById('sidebarStats').innerHTML = `<div class="stat-row"><span>练习题</span><span class="stat-val">${s.exercises.total}道</span></div><div class="stat-row"><span>测试题</span><span class="stat-val">${s.questions.total}道</span></div><div class="stat-row"><span>项目</span><span class="stat-val">${s.projects.practice + s.projects.course_design}个</span></div>`
}
function navTo(sec) { document.querySelector(`.nav-item[data-section="${sec}"]`).click() }

// ===== Exercises =====
let exPage = 1, exCat = '', exType = '', exDiff = '', exKw = '';
async function loadExercises(page = 1) {
  exPage = page;
  const d = await api(`/api/exercises?page=${page}&size=20&category=${exCat}&type=${exType}&difficulty=${exDiff}&keyword=${exKw}`); if (!d) return;
  const el = document.getElementById('sec-exercises');
  let catOpts = d.categories.map(c => `<option value="${c}"${c === exCat ? ' selected' : ''}>${c}</option>`).join('');
  el.innerHTML = `
  <div class="stat-cards"><div class="stat-card"><div class="num">${d.stats.total}</div><div class="label">总题数</div></div>
    <div class="stat-card"><div class="num">${d.stats.programming}</div><div class="label">编程题 (${Math.round(d.stats.programming / d.stats.total * 100)}%)</div></div>
    <div class="stat-card"><div class="num">${d.stats.choice}</div><div class="label">选择题</div></div></div>
  <div class="search-bar">
    <select class="select" onchange="exCat=this.value;loadExercises()"><option value="">全部分类</option>${catOpts}</select>
    <select class="select" onchange="exType=this.value;loadExercises()"><option value="">全部类型</option><option value="programming"${exType === 'programming' ? ' selected' : ''}>编程题</option><option value="choice"${exType === 'choice' ? ' selected' : ''}>选择题</option></select>
    <select class="select" onchange="exDiff=this.value;loadExercises()"><option value="">全部难度</option><option value="简单"${exDiff === '简单' ? ' selected' : ''}>简单</option><option value="中等"${exDiff === '中等' ? ' selected' : ''}>中等</option><option value="困难"${exDiff === '困难' ? ' selected' : ''}>困难</option></select>
    <input class="input" placeholder="搜索题目..." value="${exKw}" onkeydown="if(event.key==='Enter'){exKw=this.value;loadExercises()}" style="min-width:200px">
    <button class="btn btn-primary" onclick="exKw=this.previousElementSibling.value;loadExercises()"><i class="ri-search-line"></i> 搜索</button>
  </div>
  <div class="exercises-list" id="exList"></div>
  <div class="pagination" id="exPag"></div>`;
  const list = document.getElementById('exList');
  d.data.forEach(e => {
    const diffTag = e.difficulty === '简单' ? 'tag-success' : e.difficulty === '中等' ? 'tag-warning' : 'tag-danger';
    const typeTag = e.type === 'programming' ? 'tag-primary' : 'tag-info';
    list.innerHTML += `<div class="exercise-card" onclick="showExercise(${e.id})">
      <div class="ex-id">${e.id}</div><div class="ex-info"><div class="ex-title">${e.title}</div>
      <div class="ex-meta"><span class="tag tag-info">${e.category}</span><span class="tag ${typeTag}">${e.type === 'programming' ? '编程题' : '选择题'}</span><span class="tag ${diffTag}">${e.difficulty}</span></div></div></div>`
  });
  renderPagination('exPag', d.total, 20, page, p => loadExercises(p));
}
async function showExercise(id) {
  const e = await api(`/api/exercises/${id}`); if (!e) return;
  const el = document.getElementById('sec-exercises');
  let content = `<div class="detail-back" onclick="loadExercises(${exPage})"><i class="ri-arrow-left-line"></i> 返回列表</div>
  <div class="card"><h2 style="margin-bottom:12px">${e.title}</h2>
  <div style="display:flex;gap:8px;margin-bottom:16px"><span class="tag tag-info">${e.category}</span><span class="tag tag-primary">${e.type === 'programming' ? '编程题' : '选择题'}</span><span class="tag ${e.difficulty === '简单' ? 'tag-success' : e.difficulty === '中等' ? 'tag-warning' : 'tag-danger'}">${e.difficulty}</span></div>
  <div style="white-space:pre-wrap;line-height:1.8;font-size:14px;color:var(--text2)">${e.description}</div>`;
  if (e.type === 'choice' && e.options) {
    content += `<div class="question-options" id="exOpts">`;
    e.options.forEach((o, i) => { content += `<div class="option-item" onclick="checkExOption(this,'${e.answer}','${String.fromCharCode(65 + i)}')">${o}</div>` });
    content += `</div>`
  }
  if (e.type === 'programming') {
    content += `<div style="margin-top:20px"><h3 style="margin-bottom:8px">在线编程</h3><div class="code-editor">
    <div class="code-toolbar"><span class="lang-label">Python 3</span><button class="btn btn-sm btn-primary" onclick="runExCode(${e.id})"><i class="ri-play-fill"></i> 运行</button></div>
    <textarea class="code-textarea" id="exCode" spellcheck="false" placeholder="在此编写你的代码...">${e.solution.split('\n').slice(0, 1).join('\n')}\n# 请完成代码...</textarea>
    <div class="form-group" style="padding:0 16px 8px"><label>标准输入 (如果程序需要 input()，请在此输入数据，每行一个)</label><textarea class="input" id="exStdin" rows="2" placeholder="例如：5&#10;hello" style="resize:vertical;font-family:monospace"></textarea></div>
    <div class="code-output" id="exOutput">等待运行...</div></div></div>`}
  content += `<div style="margin-top:20px"><button class="btn btn-success" onclick="toggleSolution()"><i class="ri-eye-line"></i> 查看解答</button>
  <div id="solutionBlock" style="display:none"><h3 style="margin:12px 0 8px">详细解答</h3><div class="solution-block">${escapeHtml(e.solution)}</div></div></div></div>`;
  el.innerHTML = content;
}
function checkExOption(el, correct, selected) {
  document.querySelectorAll('#exOpts .option-item').forEach(o => o.classList.remove('selected', 'correct', 'wrong'));
  if (selected === correct) { el.classList.add('correct'); toast('回答正确！', 'success') }
  else { el.classList.add('wrong'); document.querySelectorAll('#exOpts .option-item')[correct.charCodeAt(0) - 65].classList.add('correct'); toast('回答错误，正确答案是' + correct, 'error') }
}
function toggleSolution() { const b = document.getElementById('solutionBlock'); b.style.display = b.style.display === 'none' ? 'block' : 'none' }
async function runExCode() {
  const code = document.getElementById('exCode').value;
  const stdin = document.getElementById('exStdin') ? document.getElementById('exStdin').value : '';
  const out = document.getElementById('exOutput'); out.innerHTML = '<span style="color:var(--warning)">运行中...</span>';
  const r = await api('/api/code/run', { method: 'POST', body: { code, lang: 'python', stdin } }); if (!r) return;
  out.innerHTML = (r.stdout ? `<span class="stdout">${escapeHtml(r.stdout)}</span>` : '') + (r.stderr ? `<span class="stderr">${escapeHtml(r.stderr)}</span>` : '') || '<span style="color:var(--text3)">(无输出)</span>'
}

// ===== Projects =====
async function loadProjects() {
  const d = await api('/api/projects'); if (!d) return;
  const el = document.getElementById('sec-projects');
  el.innerHTML = `<h3 class="section-title"><i class="ri-flask-line"></i>实践项目 (${d.practice.length}个)</h3><div class="cards-grid" id="practiceGrid"></div>
  <h3 class="section-title" style="margin-top:32px"><i class="ri-lightbulb-flash-line"></i>课程设计项目 (${d.course_design.length}个)</h3><div class="cards-grid" id="courseGrid"></div>`;
  const renderProjCards = (list, containerId) => {
    const c = document.getElementById(containerId);
    list.forEach(p => {
      c.innerHTML += `<div class="project-card" onclick="showProject(${p.id})">
      <div class="p-domain">${p.domain}${p.is_pygame ? ' 🎮' : ''}</div><div class="p-title">${p.title}</div>
      <div class="p-desc">${p.description}</div><div class="p-tech">${p.tech.map(t => `<span class="tag tag-primary">${t}</span>`).join('')}</div></div>`
    })
  };
  renderProjCards(d.practice, 'practiceGrid'); renderProjCards(d.course_design, 'courseGrid');
}
async function showProject(id) {
  const p = await api(`/api/projects/${id}`); if (!p) return;
  openModal(p.title, `<div class="p-domain" style="margin-bottom:12px">${p.domain}${p.is_pygame ? ' | Pygame项目' : ''}</div>
  <p style="line-height:1.8;color:var(--text2);margin-bottom:16px">${p.description}</p>
  <h4 style="margin-bottom:8px">技术栈</h4><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">${p.tech.map(t => `<span class="tag tag-primary">${t}</span>`).join('')}</div>
  <h4 style="margin-bottom:8px">功能需求</h4><ul style="padding-left:20px;color:var(--text2);line-height:2">${p.requirements.map(r => `<li>${r}</li>`).join('')}</ul>`, '<button class="btn btn-primary" onclick="closeModal()">关闭</button>', 'modal-lg')
}

// ===== Questions =====
let qPage = 1, qCat = '', qType = '', qKw = '';
async function loadQuestions(page = 1) {
  qPage = page;
  const d = await api(`/api/questions?page=${page}&size=20&category=${qCat}&type=${qType}&keyword=${qKw}`); if (!d) return;
  const el = document.getElementById('sec-questions');
  let catOpts = d.categories.map(c => `<option value="${c}"${c === qCat ? ' selected' : ''}>${c}</option>`).join('');
  let typeOpts = d.types.map(([v, l]) => `<option value="${v}"${v === qType ? ' selected' : ''}>${l}</option>`).join('');
  el.innerHTML = `
  <div class="stat-cards"><div class="stat-card"><div class="num">${d.stats.total}</div><div class="label">总题数</div></div>
    <div class="stat-card"><div class="num">${d.stats.subjective}</div><div class="label">主观题 (${Math.round(d.stats.subjective / d.stats.total * 100)}%)</div></div>
    <div class="stat-card"><div class="num">${d.stats.objective}</div><div class="label">客观题</div></div></div>
  <div class="search-bar">
    <select class="select" onchange="qCat=this.value;loadQuestions()"><option value="">全部分类</option>${catOpts}</select>
    <select class="select" onchange="qType=this.value;loadQuestions()"><option value="">全部题型</option>${typeOpts}</select>
    <input class="input" placeholder="搜索题目..." value="${qKw}" onkeydown="if(event.key==='Enter'){qKw=this.value;loadQuestions()}" style="min-width:200px">
    <button class="btn btn-primary" onclick="qKw=this.previousElementSibling.value;loadQuestions()"><i class="ri-search-line"></i> 搜索</button>
  </div>
  <div class="exercises-list" id="qList"></div><div class="pagination" id="qPag"></div>`;
  const list = document.getElementById('qList');
  d.data.forEach(q => {
    const tl = typeLabel(q.type), tc = typeColor(q.type);
    list.innerHTML += `<div class="exercise-card" onclick="showQuestion(${q.id})">
      <div class="ex-id" style="background:linear-gradient(135deg,${tc})">${q.id}</div>
      <div class="ex-info"><div class="ex-title">${q.question.slice(0, 50)}${q.question.length > 50 ? '...' : ''}</div>
      <div class="ex-meta"><span class="tag tag-info">${q.category}</span><span class="tag tag-primary">${tl}</span></div></div></div>`
  });
  renderPagination('qPag', d.total, 20, page, p => loadQuestions(p));
}
function typeLabel(t) { return { single_choice: '单选题', multiple_choice: '多选题', true_false: '判断题', matching: '匹配题', short_answer: '简答题', fill_table: '填表题' }[t] || t }
function typeColor(t) { return { single_choice: '#6c5ce7,#a29bfe', multiple_choice: '#00cec9,#55efc4', true_false: '#fdcb6e,#ffeaa7', matching: '#e17055,#fab1a0', short_answer: '#fd79a8,#fdcbdf', fill_table: '#0984e3,#74b9ff' }[t] || '#6c5ce7,#a29bfe' }
async function showQuestion(id) {
  const q = await api(`/api/questions/${id}`); if (!q) return;
  let body = `<span class="tag tag-info">${q.category}</span> <span class="tag tag-primary">${typeLabel(q.type)}</span>
  <h3 style="margin:12px 0">${q.question}</h3>`;
  if (q.type === 'single_choice') { body += `<div class="question-options">`; q.options.forEach((o, i) => { body += `<div class="option-item" onclick="checkQOption(this,'${q.answer}','${String.fromCharCode(65 + i)}')">${o}</div>` }); body += `</div>` }
  else if (q.type === 'multiple_choice') { body += `<div class="question-options" id="mcOpts">`; q.options.forEach((o, i) => { body += `<label class="option-item" style="display:flex;align-items:center;gap:8px"><input type="checkbox" value="${String.fromCharCode(65 + i)}">${o}</label>` }); body += `</div><button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="checkMC('${q.answer.join(',')}')">提交答案</button>` }
  else if (q.type === 'true_false') { body += `<div class="question-options"><div class="option-item" onclick="checkQOption(this,'${q.answer === '正确' ? 'A' : 'B'}','A')">A. 正确</div><div class="option-item" onclick="checkQOption(this,'${q.answer === '正确' ? 'A' : 'B'}','B')">B. 错误</div></div>` }
  else if (q.type === 'matching') { body += `<table class="matching-table table-wrap"><tr><th>左项</th><th>匹配</th></tr>`; q.left_items.forEach((l, i) => { body += `<tr><td>${l}</td><td><select class="select" id="match_${i}">${q.right_items.map(r => `<option value="${r}">${r}</option>`).join('')}</select></td></tr>` }); body += `</table><button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="toast('匹配已提交','success')">提交</button>` }
  else if (q.type === 'short_answer') { body += `<textarea class="textarea" placeholder="请输入你的答案..." rows="5"></textarea><button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="toast('答案已提交','success')">提交答案</button>` }
  else if (q.type === 'fill_table') { body += `<div class="table-wrap"><table><tr>${q.table_headers.map(h => `<th>${h}</th>`).join('')}</tr>${q.table_rows.map(r => `<tr>${r.map(c => `<td><input class="input" value="" placeholder="${c}" style="min-width:80px"></td>`).join('')}</tr>`).join('')}</table></div><button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="toast('表格已提交','success')">提交</button>` }
  body += `<div style="margin-top:16px"><button class="btn btn-success btn-sm" onclick="document.getElementById('qExplain').style.display='block'"><i class="ri-eye-line"></i> 查看解析</button>
  <div id="qExplain" style="display:none;margin-top:12px"><h4>参考答案</h4><div class="solution-block">${escapeHtml(q.answer?.toString() || '')}</div>
  <h4 style="margin-top:12px">解析</h4><p style="color:var(--text2);line-height:1.8">${q.explanation || ''}</p></div></div>`;
  openModal(`题目 #${q.id}`, body, '', 'modal-lg');
}
function checkQOption(el, correct, selected) {
  el.parentElement.querySelectorAll('.option-item').forEach(o => o.classList.remove('selected', 'correct', 'wrong'));
  if (selected === correct) { el.classList.add('correct'); toast('回答正确！', 'success') }
  else { el.classList.add('wrong'); el.parentElement.querySelectorAll('.option-item')[correct.charCodeAt(0) - 65]?.classList.add('correct'); toast('回答错误', 'error') }
}
function checkMC(correctStr) {
  const correct = correctStr.split(','); const checked = [...document.querySelectorAll('#mcOpts input:checked')].map(c => c.value);
  if (JSON.stringify(checked.sort()) === JSON.stringify(correct.sort())) toast('回答正确！', 'success'); else toast(`回答错误，正确答案: ${correct.join(',')} `, 'error')
}

// ===== Selenium Course =====
async function loadSelenium() {
  const d = await api('/api/selenium'); if (!d) return;
  const el = document.getElementById('sec-selenium');
  el.innerHTML = `<div class="tabs"><button class="tab-btn active" onclick="switchSelTab('syllabus',this)">课程大纲</button><button class="tab-btn" onclick="switchSelTab('videos',this)">教学视频 (${d.videos.length})</button></div>
  <div id="selSyllabus">${d.syllabus.map(ch => `<div class="syllabus-item" onclick="this.classList.toggle('open')">
    <div class="syllabus-header"><span class="ch-num">第${ch.chapter}章</span><span class="ch-title">${ch.title}</span><i class="ri-arrow-down-s-line ch-arrow"></i></div>
    <ul class="syllabus-sections">${ch.sections.map(s => `<li>${s}</li>`).join('')}</ul></div>`).join('')}
  </div>
  <div id="selVideos" style="display:none"><div class="cards-grid">${d.videos.map(v => `<div class="video-card" onclick="playVideo(${v.id},'${v.title}')">
    <div class="play-icon"><i class="ri-play-fill"></i></div><div><div class="v-title">${v.title}</div><div class="v-meta">第${v.chapter}章 | ${v.duration}</div></div></div>`).join('')}</div></div>`;
}
function switchSelTab(tab, btn) {
  btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
  document.getElementById('selSyllabus').style.display = tab === 'syllabus' ? 'block' : 'none';
  document.getElementById('selVideos').style.display = tab === 'videos' ? 'block' : 'none';
}
let videoTimer = null, videoPlaying = false, videoProgress = 0, videoDuration = 0;
function playVideo(id, title) {
  const chapters = { "Selenium环境搭建与Hello World": ["Python环境准备与pip安装", "下载ChromeDriver与配置PATH", "安装Selenium库", "编写第一个自动化脚本", "打开浏览器访问百度", "元素定位初体验", "常见错误排查"], "八大元素定位方法详解": ["ID定位详解与实战", "Name定位详解", "ClassName定位", "TagName定位", "LinkText与PartialLinkText", "CSS Selector基础语法", "CSS组合选择器", "定位策略总结与最佳实践"], "XPath与CSS高级定位技巧": ["XPath绝对路径与相对路径", "XPath轴定位", "XPath函数:contains/starts-with", "CSS伪类选择器", "动态元素定位策略", "定位性能对比分析"], "浏览器窗口与导航操作实战": ["窗口最大化与设置尺寸", "前进/后退/刷新", "获取当前URL与标题", "Cookie操作", "窗口截图", "执行JavaScript"], "表单元素交互操作全解": ["输入框操作:send_keys/clear", "按钮点击:click", "下拉框:Select类", "单选框与复选框", "文本域操作", "隐藏元素处理"], "文件上传与拖拽操作": ["send_keys实现文件上传", "AutoIT处理上传弹窗", "HTML5拖拽API", "ActionChains拖拽操作", "剪贴板操作"], "三种等待机制深度对比": ["time.sleep强制等待", "implicitly_wait隐式等待", "WebDriverWait显式等待", "expected_conditions条件", "自定义等待函数", "等待机制性能对比"], "Frame切换与多窗口处理": ["iframe识别与切换", "嵌套frame处理", "switch_to.window多窗口", "获取所有窗口句柄", "新窗口中操作元素"], "ActionChains高级操作": ["鼠标悬停hover", "右键点击context_click", "双击double_click", "键盘组合键", "拖拽drag_and_drop", "连续动作链"], "Page Object设计模式实战": ["PO模式概念与优势", "BasePage基类设计", "页面元素封装", "页面操作方法", "测试用例组织", "PO模式重构实战"], "pytest框架集成Selenium": ["pytest安装与基础用法", "fixture管理浏览器", "conftest.py配置", "参数化测试", "标记与过滤", "pytest-html报告"], "参数化测试与测试报告": ["@pytest.mark.parametrize", "CSV文件驱动", "Excel数据读取", "Allure报告集成", "截图附加到报告", "自定义报告模板"], "数据驱动测试框架搭建": ["框架整体架构设计", "配置文件管理", "数据层封装", "日志系统集成", "邮件通知", "持续集成配置"], "Selenium Grid分布式测试": ["Grid架构:Hub与Node", "Docker部署Grid", "RemoteWebDriver使用", "并行测试执行", "跨浏览器测试", "云测试平台集成"], "CI/CD集成与自动化测试实战": ["Jenkins安装与配置", "Git仓库管理", "Pipeline脚本编写", "定时触发测试", "测试结果通知", "完整CI/CD流程"], "Selenium最佳实践与常见问题": ["等待策略最佳实践", "元素定位最佳实践", "异常处理与重试", "性能优化技巧", "常见问题FAQ", "未来发展与Selenium 4"] };
  const outline = chapters[title] || ["课程介绍", "核心概念讲解", "代码实战演示", "常见问题解答", "课程总结"];
  const durParts = title.match(/(\d+):(\d+)/);
  videoDuration = durParts ? parseInt(durParts[1]) * 60 + parseInt(durParts[2]) : 1800;
  videoProgress = 0; videoPlaying = false; if (videoTimer) clearInterval(videoTimer);
  const fmtTime = s => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}` };
  openModal(title, `
  <div style="display:flex;gap:16px;flex-wrap:wrap">
    <div style="flex:1;min-width:400px">
      <div id="videoScreen" style="background:#000;border-radius:10px;overflow:hidden;position:relative;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;cursor:pointer" onclick="toggleVideoPlay()">
        <div id="videoCanvas" style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a1a2e,#16213e)">
          <i class="ri-video-line" style="font-size:48px;color:var(--primary-light);opacity:0.5"></i>
          <p style="color:var(--text2);margin-top:8px;font-size:14px">${title}</p>
          <p style="color:var(--text3);font-size:12px;margin-top:4px">第${id}讲</p>
        </div>
        <div id="playOverlay" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);transition:opacity .3s">
          <div id="bigPlayBtn" style="width:64px;height:64px;border-radius:50%;background:rgba(108,92,231,0.9);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .2s;box-shadow:0 4px 20px rgba(0,0,0,0.4)">
            <i class="ri-play-fill" style="font-size:28px;color:#fff;margin-left:3px" id="bigPlayIcon"></i>
          </div>
        </div>
      </div>
      <div style="background:var(--bg);border-radius:0 0 10px 10px;padding:8px 12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <input type="range" id="videoSeek" min="0" max="${videoDuration}" value="0" style="flex:1;accent-color:var(--primary);height:4px;cursor:pointer" oninput="seekVideo(this.value)">
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:8px">
            <button onclick="toggleVideoPlay()" class="btn btn-sm btn-outline" id="playPauseBtn" style="width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center"><i class="ri-play-fill" id="playIcon"></i></button>
            <button onclick="skipVideo(-10)" class="btn btn-sm btn-outline" style="width:32px;height:32px;padding:0" title="后退10秒"><i class="ri-replay-10-line"></i></button>
            <button onclick="skipVideo(10)" class="btn btn-sm btn-outline" style="width:32px;height:32px;padding:0" title="前进10秒"><i class="ri-forward-10-line"></i></button>
            <span style="font-size:12px;color:var(--text3);font-family:monospace" id="videoTime">00:00 / ${fmtTime(videoDuration)}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <i class="ri-volume-up-line" style="color:var(--text3);font-size:16px"></i>
            <input type="range" min="0" max="100" value="80" style="width:60px;accent-color:var(--primary);height:3px">
            <select class="select" style="width:auto;padding:4px 8px;font-size:11px;min-width:auto;background-image:none" onchange="changeSpeed(this.value)">
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1" selected>1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    <div style="width:240px;flex-shrink:0">
      <h4 style="margin-bottom:8px;font-size:14px;color:var(--text2)"><i class="ri-list-ordered"></i> 课程目录</h4>
      <div style="max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:4px" id="videoOutline">
        ${outline.map((s, i) => `<div class="video-outline-item" onclick="jumpToSection(${i},${outline.length})" style="padding:8px 10px;background:var(--bg);border-radius:6px;font-size:12px;color:var(--text2);cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:6px;border:1px solid transparent" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='transparent'">
          <span style="color:var(--primary-light);font-weight:600;min-width:18px">${i + 1}.</span>${s}
        </div>`).join('')}
      </div>
    </div>
  </div>`, '<button class="btn btn-primary" onclick="stopVideo();closeModal()">关闭</button>', 'modal-lg');
}
let videoSpeed = 1;
function changeSpeed(s) { videoSpeed = parseFloat(s) }
function toggleVideoPlay() {
  videoPlaying = !videoPlaying;
  const icon = document.getElementById('playIcon');
  const bigIcon = document.getElementById('bigPlayIcon');
  const overlay = document.getElementById('playOverlay');
  if (videoPlaying) {
    icon.className = 'ri-pause-fill'; bigIcon.className = 'ri-pause-fill';
    overlay.style.opacity = '0'; overlay.style.pointerEvents = 'none';
    videoTimer = setInterval(() => {
      videoProgress += videoSpeed;
      if (videoProgress >= videoDuration) { videoProgress = videoDuration; toggleVideoPlay(); toast('视频播放完毕', 'success') }
      updateVideoUI();
    }, 1000);
  } else {
    icon.className = 'ri-play-fill'; bigIcon.className = 'ri-play-fill';
    overlay.style.opacity = '1'; overlay.style.pointerEvents = 'auto';
    if (videoTimer) { clearInterval(videoTimer); videoTimer = null }
  }
}
function updateVideoUI() {
  const seek = document.getElementById('videoSeek');
  const time = document.getElementById('videoTime');
  if (seek) seek.value = videoProgress;
  const fmtTime = s => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}` };
  if (time) time.textContent = `${fmtTime(videoProgress)} / ${fmtTime(videoDuration)}`;
  // Highlight current outline section
  const items = document.querySelectorAll('#videoOutline .video-outline-item');
  if (items.length) {
    const secLen = videoDuration / items.length;
    const curSec = Math.min(Math.floor(videoProgress / secLen), items.length - 1);
    items.forEach((item, i) => {
      if (i === curSec) { item.style.background = 'rgba(108,92,231,0.15)'; item.style.color = 'var(--primary-light)' }
      else { item.style.background = 'var(--bg)'; item.style.color = 'var(--text2)' }
    });
  }
}
function seekVideo(v) { videoProgress = parseInt(v); updateVideoUI() }
function skipVideo(s) { videoProgress = Math.max(0, Math.min(videoDuration, videoProgress + s)); updateVideoUI() }
function jumpToSection(i, total) { videoProgress = Math.floor(videoDuration / total * i); updateVideoUI(); if (!videoPlaying) toggleVideoPlay() }
function stopVideo() { videoPlaying = false; if (videoTimer) { clearInterval(videoTimer); videoTimer = null } }

// ===== Cloud IDE =====
function switchIDETab(tab) {
  document.querySelectorAll('#sec-ide .tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#sec-ide .tab-content').forEach(c => c.classList.remove('active'));
  if (tab === 'python') { document.querySelector('#sec-ide .tab-btn:first-child').classList.add('active'); document.getElementById('ide-python').classList.add('active') }
  else { document.querySelector('#sec-ide .tab-btn:last-child').classList.add('active'); document.getElementById('ide-linux').classList.add('active') }
}
function clearCode() { document.getElementById('pythonCode').value = ''; document.getElementById('pythonOutput').textContent = '等待运行...' }
async function runCode(lang) {
  const code = lang === 'python' ? document.getElementById('pythonCode').value : document.getElementById('linuxCode').value;
  const stdin = lang === 'python' ? document.getElementById('pythonStdin').value : '';
  const outEl = document.getElementById(lang === 'python' ? 'pythonOutput' : 'linuxOutput');
  outEl.innerHTML = '<span style="color:var(--warning)">⏳ 运行中...</span>';
  const r = await api('/api/code/run', { method: 'POST', body: { code, lang, stdin } }); if (!r) return;
  outEl.innerHTML = (r.stdout ? `<span class="stdout">${escapeHtml(r.stdout)}</span>` : '') + (r.stderr ? `<span class="stderr">${escapeHtml(r.stderr)}</span>` : '') || '<span style="color:var(--text3)">(无输出)</span>';
  toast(r.returncode === 0 ? '运行成功' : '运行出错', r.returncode === 0 ? 'success' : 'error')
}

// ===== Exam Management =====
async function loadExams() {
  const exams = await api('/api/exams'); if (!exams) return;
  const el = document.getElementById('sec-exams');
  el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
    <h3 class="section-title" style="margin:0"><i class="ri-file-list-3-line"></i>考试管理</h3>
    <button class="btn btn-primary" onclick="showCreateExam()"><i class="ri-add-line"></i> 创建考试</button></div>
  ${exams.length ? `<div class="table-wrap"><table><thead><tr><th>ID</th><th>考试名称</th><th>时长</th><th>模式</th><th>类型</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead>
  <tbody>${exams.map(e => `<tr><td>${e.id}</td><td>${e.name}</td><td>${e.duration}分钟</td><td>${e.mode}</td><td>${e.type}</td>
  <td><span class="tag ${e.status === 'draft' ? 'tag-warning' : e.status === 'active' ? 'tag-success' : 'tag-info'}">${e.status === 'draft' ? '草稿' : e.status === 'active' ? '进行中' : '已结束'}</span></td>
  <td>${e.created_at}</td>
  <td><div style="display:flex;gap:4px;flex-wrap:wrap">
    <button class="btn btn-sm btn-outline" onclick="showExamDetail('${e.id}')"><i class="ri-eye-line"></i></button>
    <button class="btn btn-sm btn-outline" onclick="showSamplePaper('${e.id}')">样卷</button>
    <button class="btn btn-sm btn-outline" onclick="validatePaper('${e.id}')">校验</button>
    <button class="btn btn-sm btn-outline" onclick="showAntiCheat('${e.id}')">防作弊</button>
    <button class="btn btn-sm btn-outline" onclick="showAnswerSettings('${e.id}')">作答设置</button>
    <button class="btn btn-sm btn-outline" onclick="showGradingSettings('${e.id}')">判题设置</button>
    <button class="btn btn-sm btn-outline" onclick="showStudentMgmt('${e.id}')">人员</button>
    <button class="btn btn-sm btn-outline" onclick="showMonitor('${e.id}')"><i class="ri-eye-2-line"></i>监控</button>
    <button class="btn btn-sm btn-outline" onclick="showResults('${e.id}')">成绩</button>
    <button class="btn btn-sm btn-outline" onclick="showManualGrade('${e.id}')">判卷</button>
    <button class="btn btn-sm btn-outline" onclick="showAnalysis('${e.id}')">分析</button>
    <button class="btn btn-sm btn-outline" onclick="exportResults('${e.id}')"><i class="ri-download-line"></i></button>
    <button class="btn btn-sm btn-danger" onclick="deleteExam('${e.id}')"><i class="ri-delete-bin-line"></i></button>
  </div></td></tr>`).join('')}</tbody></table></div>`
      : `<div class="empty-state"><i class="ri-file-list-3-line"></i><p>暂无考试，点击上方按钮创建</p></div>`}`;
}

function showCreateExam() {
  openModal('创建考试', `<div class="exam-form">
    <div class="form-group"><label>考试名称</label><input class="input" id="examName" placeholder="请输入考试名称"></div>
    <div class="form-group"><label>考试时长(分钟)</label><input type="number" class="input" id="examDuration" value="120"></div>
    <div class="form-group"><label>试卷来源</label><select class="select" id="examPaperSrc"><option>题库抽题</option><option>手动组卷</option><option>随机组卷</option></select></div>
    <div class="form-group"><label>考试模式</label><select class="select" id="examMode"><option>在线考试</option><option>离线考试</option><option>混合模式</option></select></div>
    <div class="form-group"><label>考试类型</label><select class="select" id="examType"><option>正式考试</option><option>模拟考试</option><option>练习测试</option></select></div>
    <div class="form-group"><label>开始时间</label><input type="datetime-local" class="input" id="examStart"></div>
    <div class="form-group"><label>结束时间</label><input type="datetime-local" class="input" id="examEnd"></div>
    <div class="form-group full-width"><label>题目设置（每行: 题目名称,分值）</label><textarea class="textarea" id="examQuestions" placeholder="Python基础概念,10&#10;循环结构编程,15&#10;函数定义与调用,20"></textarea></div>
  </div>`, `<button class="btn btn-outline" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="createExam()">创建</button>`, 'modal-lg')
}
async function createExam() {
  const qs = document.getElementById('examQuestions').value.trim().split('\n').filter(l => l.trim()).map(l => { const [t, s] = l.split(','); return { title: t.trim(), score: parseInt(s) || 10 } });
  const data = {
    name: document.getElementById('examName').value, duration: parseInt(document.getElementById('examDuration').value),
    paper_source: document.getElementById('examPaperSrc').value, mode: document.getElementById('examMode').value,
    type: document.getElementById('examType').value, start_time: document.getElementById('examStart').value,
    end_time: document.getElementById('examEnd').value, questions: qs,
    students: [{ name: '张三', id: 'S001' }, { name: '李四', id: 'S002' }, { name: '王五', id: 'S003' }, { name: '赵六', id: 'S004' }, { name: '钱七', id: 'S005' }],
    admins: [{ name: '管理员', id: 'A001' }]
  };
  if (!data.name) { toast('请输入考试名称', 'warning'); return }
  const r = await api('/api/exams', { method: 'POST', body: data });
  if (r) { closeModal(); toast('考试创建成功', 'success'); loadExams() }
}
async function showExamDetail(eid) {
  const e = await api(`/api/exams/${eid}`); if (!e) return;
  openModal(e.name, `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <div><strong>ID:</strong> ${e.id}</div><div><strong>时长:</strong> ${e.duration}分钟</div>
    <div><strong>模式:</strong> ${e.mode}</div><div><strong>类型:</strong> ${e.type}</div>
    <div><strong>试卷来源:</strong> ${e.paper_source}</div><div><strong>状态:</strong> ${e.status}</div>
    <div><strong>开始时间:</strong> ${e.start_time || '未设置'}</div><div><strong>结束时间:</strong> ${e.end_time || '未设置'}</div>
    <div><strong>学生数:</strong> ${e.students.length}</div><div><strong>管理员数:</strong> ${e.admins.length}</div>
    <div><strong>题目数:</strong> ${e.questions.length}</div><div><strong>总分:</strong> ${e.questions.reduce((s, q) => s + (q.score || 0), 0)}</div>
    </div><h4 style="margin-top:16px">防作弊设置</h4><div style="color:var(--text2);font-size:13px;margin-top:8px">
    切屏限制: ${e.anti_cheat.switch_limit}次 | 全屏: ${e.anti_cheat.fullscreen ? '是' : '否'} | 禁止复制: ${e.anti_cheat.copy_disabled ? '是' : '否'} | 摄像头: ${e.anti_cheat.camera ? '是' : '否'}</div>`
    , '<button class="btn btn-primary" onclick="closeModal()">关闭</button>', 'modal-lg')
}
async function validatePaper(eid) {
  const r = await api(`/api/exams/${eid}/validate`, { method: 'POST' }); if (!r) return;
  if (r.valid) toast(`试卷校验通过！共${r.question_count}题，总分${r.total_score}分`, 'success');
  else { openModal('试卷校验结果', `<div style="color:var(--danger)"><h4>校验未通过</h4><ul style="margin-top:8px;padding-left:20px">${r.issues.map(i => `<li>${i}</li>`).join('')}</ul></div>`, '<button class="btn btn-primary" onclick="closeModal()">关闭</button>') }
}
async function showSamplePaper(eid) {
  const r = await api(`/api/exams/${eid}/sample`); if (!r) return;
  let body = `<h3>${r.exam_name}</h3><p style="color:var(--text2);margin:8px 0">时长: ${r.duration}分钟 | 总分: ${r.total_score}分</p><hr style="border-color:var(--border);margin:12px 0">`;
  r.questions.forEach((q, i) => { body += `<div style="margin-bottom:12px;padding:10px;background:var(--bg);border-radius:8px"><strong>${i + 1}. ${q.title}</strong> <span class="tag tag-primary">${q.score}分</span></div>` });
  openModal('样卷预览', body, '<button class="btn btn-primary" onclick="closeModal()">关闭</button>', 'modal-lg')
}
async function showAntiCheat(eid) {
  const e = await api(`/api/exams/${eid}`); if (!e) return;
  openModal('防作弊设置', `<div class="exam-form">
    <div class="form-group"><label>切屏次数限制</label><input type="number" class="input" id="acSwitch" value="${e.anti_cheat.switch_limit}"></div>
    <div class="form-group"><label>全屏模式</label><label class="checkbox-label"><input type="checkbox" id="acFull" ${e.anti_cheat.fullscreen ? 'checked' : ''}> 启用</label></div>
    <div class="form-group"><label>禁止复制粘贴</label><label class="checkbox-label"><input type="checkbox" id="acCopy" ${e.anti_cheat.copy_disabled ? 'checked' : ''}> 启用</label></div>
    <div class="form-group"><label>摄像头监控</label><label class="checkbox-label"><input type="checkbox" id="acCam" ${e.anti_cheat.camera ? 'checked' : ''}> 启用</label></div>
  </div>`, `<button class="btn btn-outline" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="saveAntiCheat('${eid}')">保存</button>`)
}
async function saveAntiCheat(eid) {
  await api(`/api/exams/${eid}`, { method: 'PUT', body: { anti_cheat: { switch_limit: parseInt(document.getElementById('acSwitch').value), fullscreen: document.getElementById('acFull').checked, copy_disabled: document.getElementById('acCopy').checked, camera: document.getElementById('acCam').checked } } });
  closeModal(); toast('防作弊设置已保存', 'success')
}
async function showAnswerSettings(eid) {
  const e = await api(`/api/exams/${eid}`); if (!e) return;
  openModal('作答与调试设置', `<div class="exam-form">
    <div class="form-group"><label>显示答题结果</label><label class="checkbox-label"><input type="checkbox" id="asShow" ${e.answer_settings.show_result ? 'checked' : ''}> 交卷后显示成绩</label></div>
    <div class="form-group"><label>允许调试</label><label class="checkbox-label"><input type="checkbox" id="asDebug" ${e.answer_settings.allow_debug ? 'checked' : ''}> 允许代码调试</label></div>
    <div class="form-group"><label>自动保存</label><label class="checkbox-label"><input type="checkbox" id="asSave" ${e.answer_settings.auto_save ? 'checked' : ''}> 自动保存答案</label></div>
  </div>`, `<button class="btn btn-outline" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="saveAnswerSettings('${eid}')">保存</button>`)
}
async function saveAnswerSettings(eid) {
  await api(`/api/exams/${eid}`, { method: 'PUT', body: { answer_settings: { show_result: document.getElementById('asShow').checked, allow_debug: document.getElementById('asDebug').checked, auto_save: document.getElementById('asSave').checked } } });
  closeModal(); toast('作答设置已保存', 'success')
}
async function showGradingSettings(eid) {
  const e = await api(`/api/exams/${eid}`); if (!e) return;
  openModal('判题设置', `<div class="exam-form">
    <div class="form-group"><label>自动判题</label><label class="checkbox-label"><input type="checkbox" id="gsAuto" ${e.grading_settings.auto_grade ? 'checked' : ''}> 客观题自动判分</label></div>
    <div class="form-group"><label>及格分数</label><input type="number" class="input" id="gsPass" value="${e.grading_settings.pass_score}"></div>
  </div>`, `<button class="btn btn-outline" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="saveGradingSettings('${eid}')">保存</button>`)
}
async function saveGradingSettings(eid) {
  await api(`/api/exams/${eid}`, { method: 'PUT', body: { grading_settings: { auto_grade: document.getElementById('gsAuto').checked, pass_score: parseInt(document.getElementById('gsPass').value) } } });
  closeModal(); toast('判题设置已保存', 'success')
}
async function showStudentMgmt(eid) {
  const e = await api(`/api/exams/${eid}`); if (!e) return;
  openModal('人员管理', `<h4>学生列表 (${e.students.length}人)</h4>
  <div class="table-wrap" style="margin:8px 0"><table><tr><th>ID</th><th>姓名</th></tr>${e.students.map(s => `<tr><td>${s.id}</td><td>${s.name}</td></tr>`).join('')}</table></div>
  <div class="inline-form" style="margin:12px 0"><input class="input" id="newStuName" placeholder="学生姓名"><input class="input" id="newStuId" placeholder="学生ID"><button class="btn btn-sm btn-primary" onclick="addStudent('${eid}')">添加学生</button></div>
  <h4 style="margin-top:16px">管理人员 (${e.admins.length}人)</h4>
  <div class="table-wrap" style="margin:8px 0"><table><tr><th>ID</th><th>姓名</th></tr>${e.admins.map(a => `<tr><td>${a.id}</td><td>${a.name}</td></tr>`).join('')}</table></div>
  <div class="inline-form"><input class="input" id="newAdmName" placeholder="管理员姓名"><input class="input" id="newAdmId" placeholder="管理员ID"><button class="btn btn-sm btn-success" onclick="addAdmin('${eid}')">添加管理员</button></div>`
    , '<button class="btn btn-primary" onclick="closeModal();loadExams()">关闭</button>', 'modal-lg')
}
async function addStudent(eid) {
  const n = document.getElementById('newStuName').value, id = document.getElementById('newStuId').value; if (!n) { toast('请输入姓名', 'warning'); return }
  await api(`/api/exams/${eid}/students`, { method: 'POST', body: { students: [{ name: n, id: id || 'S' + Date.now() }] } }); toast('学生已添加', 'success'); showStudentMgmt(eid)
}
async function addAdmin(eid) {
  const n = document.getElementById('newAdmName').value, id = document.getElementById('newAdmId').value; if (!n) { toast('请输入姓名', 'warning'); return }
  await api(`/api/exams/${eid}/students`, { method: 'POST', body: { admins: [{ name: n, id: id || 'A' + Date.now() }] } }); toast('管理员已添加', 'success'); showStudentMgmt(eid)
}

async function showMonitor(eid) {
  const r = await api(`/api/exams/${eid}/monitor`); if (!r) return;
  openModal('考场监控 - ' + r.exam_name, `<div class="stat-cards" style="margin-bottom:16px">
    <div class="stat-card"><div class="num">${r.total_students}</div><div class="label">总人数</div></div>
    <div class="stat-card"><div class="num" style="color:var(--success)">${r.online}</div><div class="label">在线人数</div></div>
  </div><div class="monitor-grid">${r.students.map(s => `<div class="monitor-card">
    <div class="m-name">${s.name}</div><div class="m-status"><span class="dot ${s.status === '答题中' ? 'dot-online' : s.status === '已交卷' ? 'dot-submitted' : 'dot-offline'}"></span>${s.status} | IP: ${s.ip}</div>
    <div style="font-size:12px;color:var(--text3);margin-top:4px">切屏: ${s.switch_count}次</div>
    <div class="progress-bar"><div class="fill" style="width:${s.progress}%"></div></div>
    <div style="font-size:11px;color:var(--text3);margin-top:4px">进度: ${s.progress}%</div>
  </div>`).join('')}</div>`, `<button class="btn btn-outline" onclick="showMonitor('${eid}')"><i class="ri-refresh-line"></i> 刷新</button><button class="btn btn-primary" onclick="closeModal()">关闭</button>`, 'modal-lg')
}
async function showResults(eid) {
  const r = await api(`/api/exams/${eid}/results`); if (!r) return;
  const passScore = r.pass_score;
  openModal('考试成绩', `<div class="stat-cards" style="margin-bottom:16px">
    <div class="stat-card"><div class="num">${r.stats.avg}</div><div class="label">平均分</div></div>
    <div class="stat-card"><div class="num">${r.stats.max}</div><div class="label">最高分</div></div>
    <div class="stat-card"><div class="num">${r.stats.min}</div><div class="label">最低分</div></div>
    <div class="stat-card"><div class="num">${r.stats.pass_rate}%</div><div class="label">及格率(${passScore}分)</div></div>
  </div><div class="table-wrap"><table><tr><th>排名</th><th>姓名</th><th>分数</th><th>状态</th><th>交卷时间</th></tr>
  ${r.results.map(s => `<tr><td>${s.rank}</td><td>${s.name}</td><td><strong style="color:${s.passed ? 'var(--success)' : 'var(--danger)'}">${s.score}</strong></td><td><span class="tag ${s.status === '已批阅' ? 'tag-success' : 'tag-warning'}">${s.status}</span></td><td>${s.submit_time}</td></tr>`).join('')}</table></div>`
    , `<button class="btn btn-outline" onclick="exportResults('${eid}');closeModal()"><i class="ri-download-line"></i> 导出</button><button class="btn btn-primary" onclick="closeModal()">关闭</button>`, 'modal-lg')
}
async function showManualGrade(eid) {
  const e = await api(`/api/exams/${eid}`); if (!e) return;
  let body = `<h4>选择学生和题目进行人工判卷</h4>
  <div class="exam-form" style="margin-top:12px">
    <div class="form-group"><label>学生</label><select class="select" id="mgStudent">${e.students.map(s => `<option value="${s.name}">${s.name}</option>`).join('')}</select></div>
    <div class="form-group"><label>题目</label><select class="select" id="mgQuestion">${e.questions.map((q, i) => `<option value="${i + 1}">${q.title} (${q.score}分)</option>`).join('')}</select></div>
    <div class="form-group"><label>评分</label><input type="number" class="input" id="mgScore" value="0"></div>
    <div class="form-group"><label>评语</label><textarea class="textarea" id="mgComment" placeholder="请输入评语..."></textarea></div>
  </div>`;
  openModal('人工判卷', body, `<button class="btn btn-outline" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="submitManualGrade('${eid}')">提交评分</button>`, 'modal-lg')
}
async function submitManualGrade(eid) {
  const r = await api(`/api/exams/${eid}/grade`, { method: 'POST', body: { student: document.getElementById('mgStudent').value, question_id: document.getElementById('mgQuestion').value, score: parseInt(document.getElementById('mgScore').value), comment: document.getElementById('mgComment').value } });
  if (r && r.success) { closeModal(); toast('评分已提交', 'success') }
}
async function showAnalysis(eid) {
  const r = await api(`/api/exams/${eid}/analysis`); if (!r) return;
  openModal('单题分析 - ' + r.exam_name, `<div class="table-wrap"><table><tr><th>题号</th><th>题目</th><th>正确率</th><th>平均分</th><th>满分</th><th>区分度</th><th>难度</th></tr>
  ${r.analysis.map(a => `<tr><td>${a.question_id}</td><td>${a.title}</td><td><span style="color:${a.correct_rate > 0.6 ? 'var(--success)' : 'var(--danger)'}">${(a.correct_rate * 100).toFixed(0)}%</span></td><td>${a.avg_score}</td><td>${a.max_score}</td><td>${a.discrimination}</td><td>${a.difficulty}</td></tr>`).join('')}</table></div>`
    , '<button class="btn btn-primary" onclick="closeModal()">关闭</button>', 'modal-lg')
}
async function exportResults(eid) {
  const r = await api(`/api/exams/${eid}/export`); if (!r) return;
  const blob = new Blob([r.csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = r.filename; a.click(); URL.revokeObjectURL(url);
  toast('成绩已导出', 'success')
}
async function deleteExam(eid) {
  const ok = await confirmModal('删除考试', '确定要删除这场考试吗？此操作不可恢复。');
  if (ok) { await api(`/api/exams/${eid}`, { method: 'DELETE' }); toast('考试已删除', 'success'); loadExams() }
}

// ===== Utilities =====
function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML }
function renderPagination(containerId, total, size, current, callback) {
  const pages = Math.ceil(total / size); if (pages <= 1) return;
  const c = document.getElementById(containerId); c.innerHTML = '';
  const addBtn = (label, page, active = false) => { const b = document.createElement('button'); b.className = 'page-btn' + (active ? ' active' : ''); b.textContent = label; b.onclick = () => callback(page); c.appendChild(b) };
  if (current > 1) addBtn('‹', current - 1);
  let start = Math.max(1, current - 3), end = Math.min(pages, current + 3);
  for (let i = start; i <= end; i++)addBtn(i, i, i === current);
  if (current < pages) addBtn('›', current + 1);
  const info = document.createElement('span'); info.style.cssText = 'padding:6px 12px;font-size:12px;color:var(--text3)'; info.textContent = `共${total}条`; c.appendChild(info);
}

// ===== Init =====
loadDashboard();
