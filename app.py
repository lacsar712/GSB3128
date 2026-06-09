from flask import Flask, render_template, jsonify, request
import json, os, uuid, subprocess, sys, io
from datetime import datetime

app = Flask(__name__)
DATA = os.path.join(os.path.dirname(__file__), 'data')

def load(name):
    with open(os.path.join(DATA, name), encoding='utf-8') as f:
        return json.load(f)

exercises = load('exercises.json')
questions = load('questions.json')
projects = load('projects.json')
selenium_data = load('selenium.json')

# In-memory exam storage
exams = {}
exam_results = {}

@app.route('/')
def index():
    return render_template('index.html')

# ===== Python Exercises =====
@app.route('/api/exercises')
def get_exercises():
    cat = request.args.get('category', '')
    typ = request.args.get('type', '')
    diff = request.args.get('difficulty', '')
    kw = request.args.get('keyword', '')
    page = int(request.args.get('page', 1))
    size = int(request.args.get('size', 20))
    filtered = exercises
    if cat: filtered = [e for e in filtered if e['category'] == cat]
    if typ: filtered = [e for e in filtered if e['type'] == typ]
    if diff: filtered = [e for e in filtered if e['difficulty'] == diff]
    if kw: filtered = [e for e in filtered if kw in e['title'] or kw in e.get('description','')]
    total = len(filtered)
    start = (page - 1) * size
    cats = sorted(set(e['category'] for e in exercises))
    return jsonify({"data": filtered[start:start+size], "total": total, "categories": cats,
                     "stats": {"total": len(exercises), "programming": sum(1 for e in exercises if e['type']=='programming'),
                               "choice": sum(1 for e in exercises if e['type']=='choice')}})

@app.route('/api/exercises/<int:eid>')
def get_exercise(eid):
    for e in exercises:
        if e['id'] == eid: return jsonify(e)
    return jsonify({"error": "未找到"}), 404

# ===== Projects =====
@app.route('/api/projects')
def get_projects():
    return jsonify(projects)

@app.route('/api/projects/<int:pid>')
def get_project(pid):
    for p in projects['practice'] + projects['course_design']:
        if p['id'] == pid: return jsonify(p)
    return jsonify({"error": "未找到"}), 404

# ===== Software Testing Questions =====
@app.route('/api/questions')
def get_questions():
    cat = request.args.get('category', '')
    typ = request.args.get('type', '')
    kw = request.args.get('keyword', '')
    page = int(request.args.get('page', 1))
    size = int(request.args.get('size', 20))
    filtered = questions
    if cat: filtered = [q for q in filtered if q['category'] == cat]
    if typ: filtered = [q for q in filtered if q['type'] == typ]
    if kw: filtered = [q for q in filtered if kw in q['question']]
    total = len(filtered)
    start = (page - 1) * size
    cats = sorted(set(q['category'] for q in questions))
    types = sorted(set(q['type'] for q in questions))
    type_map = {"single_choice":"单选题","multiple_choice":"多选题","true_false":"判断题",
                "matching":"匹配题","short_answer":"简答题","fill_table":"填表题"}
    return jsonify({"data": filtered[start:start+size], "total": total, "categories": cats,
                     "types": [(t, type_map.get(t,t)) for t in types],
                     "stats": {"total": len(questions),
                               "subjective": sum(1 for q in questions if q['type'] in ('short_answer','fill_table')),
                               "objective": sum(1 for q in questions if q['type'] not in ('short_answer','fill_table'))}})

@app.route('/api/questions/<int:qid>')
def get_question(qid):
    for q in questions:
        if q['id'] == qid: return jsonify(q)
    return jsonify({"error": "未找到"}), 404

# ===== Selenium Course =====
@app.route('/api/selenium')
def get_selenium():
    return jsonify(selenium_data)

# ===== Code Execution =====
@app.route('/api/code/run', methods=['POST'])
def run_code():
    code = request.json.get('code', '')
    stdin_data = request.json.get('stdin', '')
    lang = request.json.get('lang', 'python')
    try:
        if lang == 'python':
            # Wrap code to override input() to avoid EOFError when no stdin provided
            wrapper = (
                "import sys as _sys\n"
                "_stdin_lines = _sys.stdin.read().splitlines()\n"
                "_stdin_idx = [0]\n"
                "_orig_input = input\n"
                "def input(prompt=''):\n"
                "    if _stdin_idx[0] < len(_stdin_lines):\n"
                "        line = _stdin_lines[_stdin_idx[0]]\n"
                "        _stdin_idx[0] += 1\n"
                "        return line\n"
                "    return ''\n"
                "import builtins\n"
                "builtins.input = input\n"
            )
            wrapped_code = wrapper + code
            result = subprocess.run([sys.executable, '-c', wrapped_code], capture_output=True, text=True,
                                     timeout=10, input=stdin_data)
        else:
            result = subprocess.run(['bash', '-c', code], capture_output=True, text=True,
                                     timeout=10, input=stdin_data)
        return jsonify({"stdout": result.stdout, "stderr": result.stderr, "returncode": result.returncode})
    except subprocess.TimeoutExpired:
        return jsonify({"stdout": "", "stderr": "执行超时（10秒限制）", "returncode": -1})
    except Exception as e:
        return jsonify({"stdout": "", "stderr": str(e), "returncode": -1})

# ===== Exam Management =====
@app.route('/api/exams', methods=['GET'])
def list_exams():
    return jsonify(list(exams.values()))

@app.route('/api/exams', methods=['POST'])
def create_exam():
    data = request.json
    eid = str(uuid.uuid4())[:8]
    exam = {
        "id": eid, "name": data.get("name","未命名考试"),
        "paper_source": data.get("paper_source","题库抽题"),
        "duration": data.get("duration", 120),
        "mode": data.get("mode","在线考试"),
        "type": data.get("type","正式考试"),
        "start_time": data.get("start_time",""),
        "end_time": data.get("end_time",""),
        "anti_cheat": data.get("anti_cheat", {"switch_limit": 3, "fullscreen": True, "copy_disabled": True, "camera": False}),
        "answer_settings": data.get("answer_settings", {"show_result": False, "allow_debug": True, "auto_save": True}),
        "grading_settings": data.get("grading_settings", {"auto_grade": True, "pass_score": 60}),
        "questions": data.get("questions", []),
        "students": data.get("students", []),
        "admins": data.get("admins", []),
        "status": "draft",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    exams[eid] = exam
    exam_results[eid] = []
    return jsonify(exam)

@app.route('/api/exams/<eid>', methods=['GET'])
def get_exam(eid):
    if eid in exams: return jsonify(exams[eid])
    return jsonify({"error": "未找到"}), 404

@app.route('/api/exams/<eid>', methods=['PUT'])
def update_exam(eid):
    if eid not in exams: return jsonify({"error":"未找到"}), 404
    exams[eid].update(request.json)
    return jsonify(exams[eid])

@app.route('/api/exams/<eid>', methods=['DELETE'])
def delete_exam(eid):
    if eid in exams:
        del exams[eid]
        return jsonify({"success": True})
    return jsonify({"error":"未找到"}), 404

@app.route('/api/exams/<eid>/validate', methods=['POST'])
def validate_paper(eid):
    if eid not in exams: return jsonify({"error":"未找到"}), 404
    exam = exams[eid]
    issues = []
    if not exam['questions']: issues.append("试卷没有题目")
    if not exam['name']: issues.append("考试名称不能为空")
    if exam['duration'] <= 0: issues.append("考试时长必须大于0")
    return jsonify({"valid": len(issues)==0, "issues": issues,
                     "question_count": len(exam['questions']),
                     "total_score": sum(q.get('score',0) for q in exam['questions'])})

@app.route('/api/exams/<eid>/sample', methods=['GET'])
def sample_paper(eid):
    if eid not in exams: return jsonify({"error":"未找到"}), 404
    exam = exams[eid]
    return jsonify({"exam_name": exam['name'], "duration": exam['duration'],
                     "questions": exam['questions'], "total_score": sum(q.get('score',0) for q in exam['questions'])})

@app.route('/api/exams/<eid>/students', methods=['POST'])
def add_students(eid):
    if eid not in exams: return jsonify({"error":"未找到"}), 404
    students = request.json.get('students', [])
    admins = request.json.get('admins', [])
    if students: exams[eid]['students'].extend(students)
    if admins: exams[eid]['admins'].extend(admins)
    return jsonify({"students": exams[eid]['students'], "admins": exams[eid]['admins']})

@app.route('/api/exams/<eid>/monitor', methods=['GET'])
def monitor_exam(eid):
    if eid not in exams: return jsonify({"error":"未找到"}), 404
    exam = exams[eid]
    import random
    students_status = []
    for s in exam.get('students', []):
        students_status.append({"name": s.get('name',''), "status": random.choice(["答题中","已交卷","未开始"]),
                                 "progress": random.randint(0,100), "switch_count": random.randint(0,5),
                                 "ip": f"192.168.1.{random.randint(1,254)}"})
    return jsonify({"exam_name": exam['name'], "status": exam['status'],
                     "total_students": len(exam['students']),
                     "online": random.randint(0, len(exam['students'])),
                     "students": students_status})

@app.route('/api/exams/<eid>/results', methods=['GET'])
def exam_results_api(eid):
    if eid not in exams: return jsonify({"error":"未找到"}), 404
    import random
    exam = exams[eid]
    pass_score = exam.get('grading_settings', {}).get('pass_score', 60)
    results = []
    for s in exam.get('students', []):
        score = random.randint(30,100)
        results.append({"name": s.get('name',''), "score": score,
                         "rank": 0, "status": "已批阅" if random.random() > 0.3 else "待批阅",
                         "submit_time": "2024-01-15 10:30:00"})
    results.sort(key=lambda x: -x['score'])
    for i, r in enumerate(results): r['rank'] = i + 1
    avg = sum(r['score'] for r in results) / max(len(results),1)
    return jsonify({"results": results, "stats": {"avg": round(avg,1),
                     "max": max((r['score'] for r in results), default=0),
                     "min": min((r['score'] for r in results), default=0),
                     "pass_rate": round(sum(1 for r in results if r['score']>=pass_score)/max(len(results),1)*100,1),
                     "pass_score": pass_score,
                     "total": len(results)}})

@app.route('/api/exams/<eid>/grade', methods=['POST'])
def manual_grade(eid):
    if eid not in exams: return jsonify({"error":"未找到"}), 404
    data = request.json
    return jsonify({"success": True, "student": data.get('student',''),
                     "question_id": data.get('question_id',''), "score": data.get('score',0),
                     "comment": data.get('comment','')})

@app.route('/api/exams/<eid>/analysis', methods=['GET'])
def question_analysis(eid):
    if eid not in exams: return jsonify({"error":"未找到"}), 404
    import random
    exam = exams[eid]
    analysis = []
    for i, q in enumerate(exam.get('questions',[])):
        analysis.append({"question_id": i+1, "title": q.get('title',f'题目{i+1}'),
                          "correct_rate": round(random.uniform(0.3,0.95),2),
                          "avg_score": round(random.uniform(3,10),1),
                          "max_score": q.get('score',10),
                          "discrimination": round(random.uniform(0.1,0.8),2),
                          "difficulty": round(random.uniform(0.2,0.9),2)})
    return jsonify({"analysis": analysis, "exam_name": exam['name']})

@app.route('/api/exams/<eid>/export', methods=['GET'])
def export_results(eid):
    if eid not in exams: return jsonify({"error":"未找到"}), 404
    import random
    exam = exams[eid]
    csv_lines = ["姓名,分数,排名,状态,提交时间"]
    for i, s in enumerate(exam.get('students',[])):
        score = random.randint(30,100)
        csv_lines.append(f"{s.get('name','')},{score},{i+1},已批阅,2024-01-15 10:30:00")
    return jsonify({"csv": "\n".join(csv_lines), "filename": f"{exam['name']}_成绩.csv"})

@app.route('/api/stats')
def get_stats():
    return jsonify({
        "exercises": {"total": len(exercises), "programming": sum(1 for e in exercises if e['type']=='programming'),
                       "choice": sum(1 for e in exercises if e['type']=='choice')},
        "questions": {"total": len(questions),
                       "subjective": sum(1 for q in questions if q['type'] in ('short_answer','fill_table')),
                       "objective": sum(1 for q in questions if q['type'] not in ('short_answer','fill_table'))},
        "projects": {"practice": len(projects['practice']), "course_design": len(projects['course_design'])},
        "selenium": {"chapters": len(selenium_data['syllabus']), "videos": len(selenium_data['videos'])},
        "exams": len(exams)
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3128, debug=True)
