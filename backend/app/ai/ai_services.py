"""
AI Module for TalentConnect
- Smart Skill Matching (cosine similarity)
- Skill Recommendations (co-occurrence)
- Fraud Detection (behavioral analytics)
- Skill Verification Quiz Generation
- AI Chatbot
"""
import numpy as np
import httpx
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MultiLabelBinarizer
from collections import defaultdict
from typing import List, Dict, Optional, Tuple
import re

from app.core.config import settings


# ─── SKILL MATCHING ──────────────────────────────────────────
class SkillMatcher:
    """
    Cosine similarity based skill matching.
    Builds a skill tag vector space and ranks mentors by similarity to learner request.
    """

    def rank_mentors(
        self,
        requested_skill_tags: List[str],
        mentor_profiles: List[Dict],
    ) -> List[Tuple[Dict, float]]:
        """
        requested_skill_tags: tags from the skill the learner wants
        mentor_profiles: list of {"user_skill": ..., "tags": [...]}
        Returns sorted list of (profile, score)
        """
        if not mentor_profiles:
            return []

        all_tags = set(requested_skill_tags)
        for p in mentor_profiles:
            all_tags.update(p.get("tags", []))

        all_tags = sorted(all_tags)
        tag_index = {t: i for i, t in enumerate(all_tags)}

        def vectorize(tags):
            vec = np.zeros(len(all_tags))
            for t in tags:
                if t in tag_index:
                    vec[tag_index[t]] = 1.0
            return vec

        query_vec = vectorize(requested_skill_tags).reshape(1, -1)

        scored = []
        for profile in mentor_profiles:
            mentor_vec = vectorize(profile.get("tags", [])).reshape(1, -1)
            score = float(cosine_similarity(query_vec, mentor_vec)[0][0])
            scored.append((profile, score))

        return sorted(scored, key=lambda x: x[1], reverse=True)


skill_matcher = SkillMatcher()


# ─── SKILL RECOMMENDATIONS ───────────────────────────────────
class SkillRecommender:
    """
    Co-occurrence based skill recommendation.
    Skills that often appear together in user profiles are recommended together.
    """

    # Predefined co-occurrence map (in production, build from DB analytics)
    SKILL_GRAPH: Dict[str, List[str]] = {
        "python": ["django", "flask", "fastapi", "machine learning", "data science", "numpy"],
        "javascript": ["react", "node.js", "typescript", "vue.js", "next.js"],
        "react": ["typescript", "redux", "tailwind css", "next.js", "graphql"],
        "machine learning": ["deep learning", "python", "tensorflow", "pytorch", "data science"],
        "flutter": ["dart", "firebase", "android development", "ios development"],
        "java": ["spring boot", "android development", "microservices", "sql"],
        "sql": ["postgresql", "mysql", "data science", "backend development"],
        "html": ["css", "javascript", "tailwind css", "bootstrap"],
        "css": ["html", "javascript", "tailwind css", "sass"],
        "node.js": ["javascript", "express.js", "mongodb", "rest api"],
        "data science": ["python", "machine learning", "sql", "pandas", "tableau"],
        "figma": ["ui/ux design", "prototyping", "css", "adobe xd"],
        "docker": ["kubernetes", "devops", "linux", "ci/cd", "aws"],
    }

    def recommend(
        self,
        user_skills: List[str],
        all_platform_skills: List[str],
        top_n: int = 5,
        co_graph: Optional[Dict[str, Dict[str, float]]] = None,
    ) -> List[Tuple[str, float]]:
        user_skills_lower = [s.lower() for s in user_skills]
        scores = defaultdict(float)

        for skill in user_skills_lower:
            related = self.SKILL_GRAPH.get(skill, [])
            for r in related:
                if r not in user_skills_lower:
                    scores[r] += 1.0

        if co_graph:
            for skill in user_skills_lower:
                related = co_graph.get(skill, {})
                for r, weight in related.items():
                    if r not in user_skills_lower:
                        scores[r] += float(weight)

        # Filter to platform skills only
        platform_lower = {s.lower(): s for s in all_platform_skills}
        filtered = [
            (platform_lower[k], v)
            for k, v in scores.items()
            if k in platform_lower
        ]

        return sorted(filtered, key=lambda x: x[1], reverse=True)[:top_n]


skill_recommender = SkillRecommender()


# ─── FRAUD DETECTION ─────────────────────────────────────────
class FraudDetector:
    CANCELLATION_THRESHOLD = 3
    HIGH_CANCELLATION_THRESHOLD = 5
    FRAUD_SCORE_INCREMENT = 0.2

    def analyze_user(self, user_data: Dict) -> Dict:
        """
        Returns risk assessment dict:
        {risk_level, score, triggers, recommendation}
        """
        triggers = []
        score = user_data.get("fraud_score", 0.0)
        cancellations = user_data.get("cancellation_count", 0)

        if cancellations >= self.HIGH_CANCELLATION_THRESHOLD:
            triggers.append(f"High cancellation count: {cancellations}")
            score = min(score + 0.3, 1.0)
        elif cancellations >= self.CANCELLATION_THRESHOLD:
            triggers.append(f"Multiple cancellations: {cancellations}")
            score = min(score + 0.15, 1.0)

        reputation = user_data.get("reputation_score", 5.0)
        if reputation < 2.0 and user_data.get("total_sessions", 0) > 5:
            triggers.append(f"Very low reputation score: {reputation:.1f}")
            score = min(score + 0.2, 1.0)

        risk_level = "low"
        if score >= 0.7:
            risk_level = "high"
        elif score >= 0.4:
            risk_level = "medium"

        recommendation = {
            "low": "No action required.",
            "medium": "Send automated warning to user.",
            "high": "Consider suspension pending review.",
        }[risk_level]

        return {
            "risk_level": risk_level,
            "fraud_score": round(score, 2),
            "triggers": triggers,
            "recommendation": recommendation,
        }


fraud_detector = FraudDetector()


# ─── SKILL VERIFICATION QUIZ ─────────────────────────────────
SKILL_QUIZZES: Dict[str, List[Dict]] = {
    "python": [
        {"question": "What is the output of `print(type([]))`?", "options": ["<class 'tuple'>", "<class 'list'>", "<class 'dict'>", "<class 'set'>"], "answer": 1},
        {"question": "Which keyword is used to define a generator function?", "options": ["return", "async", "yield", "gen"], "answer": 2},
        {"question": "What does `*args` represent in a function definition?", "options": ["Keyword arguments", "Variable positional arguments", "Default arguments", "Required arguments"], "answer": 1},
        {"question": "Which of the following is immutable?", "options": ["list", "dict", "tuple", "set"], "answer": 2},
        {"question": "What is the time complexity of Python dict lookup?", "options": ["O(n)", "O(log n)", "O(1)", "O(n²)"], "answer": 2},
    ],
    "javascript": [
        {"question": "What does `typeof null` return?", "options": ["'null'", "'undefined'", "'object'", "'boolean'"], "answer": 2},
        {"question": "Which method converts JSON string to object?", "options": ["JSON.stringify()", "JSON.parse()", "JSON.convert()", "JSON.decode()"], "answer": 1},
        {"question": "What is the result of `0.1 + 0.2 === 0.3`?", "options": ["true", "false", "undefined", "NaN"], "answer": 1},
        {"question": "Which is NOT a JavaScript data type?", "options": ["Symbol", "BigInt", "Float", "undefined"], "answer": 2},
        {"question": "What does `Array.prototype.reduce` return?", "options": ["Array", "A single value", "Boolean", "Object"], "answer": 1},
    ],
    "react": [
        {"question": "What hook is used to manage side effects?", "options": ["useState", "useRef", "useEffect", "useMemo"], "answer": 2},
        {"question": "What does JSX stand for?", "options": ["JavaScript Syntax Extension", "JavaScript XML", "Java Syntax Extension", "None"], "answer": 1},
        {"question": "How do you pass data from parent to child?", "options": ["State", "Props", "Context only", "Redux only"], "answer": 1},
        {"question": "Which hook avoids unnecessary recalculations?", "options": ["useCallback", "useEffect", "useMemo", "useRef"], "answer": 2},
        {"question": "What is the virtual DOM?", "options": ["A browser API", "A lightweight JS representation of the real DOM", "A database", "A CSS framework"], "answer": 1},
    ],
    "sql": [
        {"question": "Which SQL clause filters rows AFTER grouping?", "options": ["WHERE", "HAVING", "FILTER", "LIMIT"], "answer": 1},
        {"question": "What does INNER JOIN return?", "options": ["All rows from left", "All rows from right", "Matching rows from both tables", "All rows from both"], "answer": 2},
        {"question": "Which command removes all rows but keeps table structure?", "options": ["DELETE", "DROP", "TRUNCATE", "REMOVE"], "answer": 2},
        {"question": "What does PRIMARY KEY enforce?", "options": ["Uniqueness only", "NOT NULL only", "Both uniqueness and NOT NULL", "Foreign reference"], "answer": 2},
        {"question": "Which aggregate function counts non-NULL values?", "options": ["SUM()", "COUNT(*)", "COUNT(column)", "AVG()"], "answer": 2},
    ],
    "default": [
        {"question": "What does OOP stand for?", "options": ["Object Oriented Programming", "Open Operating Protocol", "Object Output Process", "None"], "answer": 0},
        {"question": "What is an API?", "options": ["Application Programming Interface", "Advanced Protocol Integration", "Automated Process Index", "None"], "answer": 0},
        {"question": "What does HTTP stand for?", "options": ["HyperText Transfer Protocol", "High Transfer Text Process", "Hyper Terminal Transfer Protocol", "None"], "answer": 0},
        {"question": "What is version control used for?", "options": ["Database management", "Tracking code changes over time", "Server configuration", "UI design"], "answer": 1},
        {"question": "What does REST stand for?", "options": ["Remote Execution Standard Transfer", "Representational State Transfer", "Remote State Transfer", "None"], "answer": 1},
    ]
}


def get_quiz_for_skill(skill_name: str) -> List[Dict]:
    key = skill_name.lower()
    for k in SKILL_QUIZZES:
        if k in key or key in k:
            return SKILL_QUIZZES[k]
    return SKILL_QUIZZES["default"]


# ─── AI CHATBOT ──────────────────────────────────────────────
LEARNING_ROADMAPS = {
    "dsa": """**Data Structures & Algorithms Roadmap:**
1. **Arrays & Strings** – Basic operations, two-pointer, sliding window
2. **Linked Lists** – Singly, doubly, Floyd's cycle detection
3. **Stacks & Queues** – Monotonic stack, deque patterns
4. **Trees** – BST, DFS/BFS, tree DP
5. **Graphs** – BFS, DFS, Dijkstra, Union-Find
6. **Dynamic Programming** – Memoization, tabulation, classic patterns
7. **Practice:** LeetCode (Blind 75), NeetCode roadmap""",

    "web development": """**Web Development Roadmap:**
1. **HTML/CSS** – Semantic HTML, Flexbox, Grid, Responsive design
2. **JavaScript** – ES6+, DOM, async/await, fetch API
3. **Frontend Framework** – React or Vue.js
4. **Backend** – Node.js + Express or Python FastAPI/Django
5. **Databases** – SQL (PostgreSQL) + NoSQL (MongoDB)
6. **Deployment** – Git, Docker, Vercel/Railway/AWS
7. **Resources:** The Odin Project, freeCodeCamp, MDN Docs""",

    "machine learning": """**Machine Learning Roadmap:**
1. **Math Foundations** – Linear algebra, calculus, probability & stats
2. **Python** – NumPy, Pandas, Matplotlib
3. **Classical ML** – Scikit-learn: regression, classification, clustering
4. **Deep Learning** – Neural networks, TensorFlow / PyTorch
5. **Projects** – Kaggle competitions, personal datasets
6. **Resources:** fast.ai, Andrew Ng Coursera, Kaggle Learn""",

    "flutter": """**Flutter Development Roadmap:**
1. **Dart Language** – Variables, OOP, async/await
2. **Flutter Basics** – Widgets, StatelessWidget, StatefulWidget
3. **UI Design** – Layouts, themes, animations
4. **State Management** – Provider, Riverpod, or Bloc
5. **Backend Integration** – REST APIs, Firebase
6. **Publishing** – Google Play Store, App Store
7. **Resources:** Flutter Docs, Flutter & Dart on Udemy""",
}


class TalentChatbot:
    def _clean_topic(self, text: str) -> str:
        cleaned = re.sub(
            r"\b(in detail|detailed|deep dive|explain fully|step by step|short|brief|in short|summarize|quick answer|concise|one line)\b",
            "",
            text,
            flags=re.IGNORECASE,
        )
        return re.sub(r"\s+", " ", cleaned).strip(" .?-")

    def _response_style(self, user_message: str) -> str:
        msg = user_message.lower()
        if any(
            phrase in msg
            for phrase in [
                "in detail",
                "detailed",
                "deep dive",
                "explain fully",
                "step by step",
                "elaborate",
                "full answer",
            ]
        ):
            return "detailed"
        if any(
            phrase in msg
            for phrase in [
                "short",
                "brief",
                "in short",
                "summarize",
                "quick answer",
                "concise",
                "one line",
            ]
        ):
            return "short"
        return "normal"

    def _fallback_response(self, user_message: str, history: List[Dict]) -> str:
        msg_lower = user_message.lower()
        style = self._response_style(user_message)

        def maybe_expand(short_text: str, detailed_text: str) -> str:
            if style == "short":
                return short_text
            if style == "detailed":
                return detailed_text
            return detailed_text if len(user_message.split()) > 8 else short_text

        # Roadmap queries
        for topic, roadmap in LEARNING_ROADMAPS.items():
            if topic in msg_lower:
                return f"Here's a learning roadmap for **{topic.title()}**:\n\n{roadmap}"

        learn_match = re.search(
            r"(?:how do i learn|how can i learn|learn|study|master)\s+(.+?)(?:\?|$)",
            msg_lower,
        )
        if learn_match:
            topic = self._clean_topic(learn_match.group(1))
            topic_title = topic.title()
            return maybe_expand(
                f"To learn **{topic_title}**, start with the basics, practice consistently, build small projects, and revise weak areas weekly.",
                (
                    f"Here is a practical way to learn **{topic_title}** step by step:\n\n"
                    "1. **Start with fundamentals**\n"
                    f"   Learn the core concepts, syntax, and common terminology in {topic_title}.\n"
                    "2. **Follow a structured resource**\n"
                    "   Pick one course, one documentation source, and avoid jumping between too many resources.\n"
                    "3. **Practice every day**\n"
                    "   Spend time writing code, solving problems, or applying the concept actively.\n"
                    "4. **Build mini-projects**\n"
                    "   Small projects help convert theory into actual skill.\n"
                    "5. **Review mistakes**\n"
                    "   Keep notes of what confuses you and revisit those topics.\n"
                    "6. **Move to interview or real-world use cases**\n"
                    f"   Once comfortable, solve realistic problems in {topic_title}.\n\n"
                    f"If you want, I can also give you a **full roadmap for {topic_title}** with beginner-to-advanced stages."
                ),
            )

        comparisons = {
            ("dbms", "rdbms"): (
                "**DBMS** stores and manages data in general, while **RDBMS** is a type of DBMS that stores data in related tables.",
                (
                    "**DBMS vs RDBMS**\n\n"
                    "- **DBMS**: general database management system\n"
                    "- **RDBMS**: relational database management system based on tables and relations\n\n"
                    "**Main differences:**\n"
                    "1. **Structure**: DBMS may store data in simpler forms, RDBMS uses tables\n"
                    "2. **Relationships**: RDBMS supports relations using keys\n"
                    "3. **Normalization**: more central in RDBMS\n"
                    "4. **Transactions**: RDBMS usually gives stronger ACID support\n"
                    "5. **Examples**: DBMS examples are simpler legacy systems; RDBMS examples include MySQL, PostgreSQL, Oracle, SQL Server\n\n"
                    "In most modern software projects, when people say database, they usually mean an RDBMS."
                ),
            ),
            ("stack", "queue"): (
                "**Stack** follows LIFO, while **queue** follows FIFO.",
                (
                    "**Stack vs Queue**\n\n"
                    "- **Stack**: Last In First Out\n"
                    "- **Queue**: First In First Out\n\n"
                    "**Stack operations:** push, pop, top\n"
                    "**Queue operations:** enqueue, dequeue, front\n\n"
                    "**Use cases:**\n"
                    "- Stack: function calls, undo, backtracking\n"
                    "- Queue: scheduling, BFS, task processing\n"
                ),
            ),
            ("process", "thread"): (
                "**Process** is an independent program in execution; **thread** is a lightweight execution unit inside a process.",
                (
                    "**Process vs Thread**\n\n"
                    "- **Process** has its own memory space\n"
                    "- **Thread** shares memory with other threads in the same process\n\n"
                    "**Processes** are heavier but safer in isolation.\n"
                    "**Threads** are lighter and faster for concurrent tasks, but need synchronization.\n"
                ),
            ),
        }

        if "difference between" in msg_lower:
            for (left, right), (short_text, detailed_text) in comparisons.items():
                if left in msg_lower and right in msg_lower:
                    return maybe_expand(short_text, detailed_text)

        concept_guides = {
            "recursion": (
                "Recursion means a function solves a problem by calling itself on a smaller input. "
                "Every recursive solution should have a **base case** to stop and a **recursive case** to reduce the problem.",
                (
                    "**Recursion** is a problem-solving method where a function calls itself.\n\n"
                    "**Core idea:**\n"
                    "1. Solve a very small version directly. This is the **base case**.\n"
                    "2. Reduce the current problem into a smaller one. This is the **recursive step**.\n\n"
                    "**Example: factorial of 4**\n"
                    "- `fact(4) = 4 * fact(3)`\n"
                    "- `fact(3) = 3 * fact(2)`\n"
                    "- `fact(2) = 2 * fact(1)`\n"
                    "- `fact(1) = 1` base case\n\n"
                    "**Where recursion is useful:** trees, graphs, backtracking, divide-and-conquer, DFS.\n"
                    "**Risk:** if the base case is wrong, it can cause infinite recursion or stack overflow."
                ),
            ),
            "binary search": (
                "Binary search finds a value in a **sorted** array by repeatedly checking the middle element and discarding half the search space.",
                (
                    "**Binary search** works only on sorted data.\n\n"
                    "**How it works:**\n"
                    "1. Take `low`, `high`, and compute `mid`\n"
                    "2. Compare target with the middle value\n"
                    "3. Move left or right half accordingly\n"
                    "4. Repeat until found or range becomes empty\n\n"
                    "**Time complexity:** `O(log n)`\n"
                    "**Why it is fast:** each step cuts the remaining search space in half.\n\n"
                    "**Use cases:** searching in sorted arrays, answer-search problems, lower/upper bound problems."
                ),
            ),
            "dbms": (
                "DBMS is software used to store, organize, query, and manage data efficiently, for example PostgreSQL, MySQL, or MongoDB.",
                (
                    "**DBMS** stands for Database Management System.\n\n"
                    "It helps you:\n"
                    "- store data in a structured way\n"
                    "- retrieve data with queries\n"
                    "- update and delete records safely\n"
                    "- manage concurrency, backup, and security\n\n"
                    "**Why DBMS matters:** applications need reliable data storage, fast querying, and consistent updates.\n"
                    "**Examples:** MySQL, PostgreSQL, Oracle, MongoDB.\n"
                    "**Core topics to learn:** normalization, keys, joins, transactions, indexing."
                ),
            ),
            "normalization": (
                "Normalization is the process of organizing database tables to reduce redundancy and improve data consistency.",
                (
                    "**Normalization** organizes relational tables so the same data is not repeated unnecessarily.\n\n"
                    "**Why use it:**\n"
                    "- avoids duplicate data\n"
                    "- reduces update anomalies\n"
                    "- keeps data consistent\n\n"
                    "**Common normal forms:**\n"
                    "1. **1NF**: atomic values, no repeating groups\n"
                    "2. **2NF**: remove partial dependency on composite keys\n"
                    "3. **3NF**: remove transitive dependency\n\n"
                    "**Tradeoff:** highly normalized schemas are clean, but some systems use controlled denormalization for performance."
                ),
            ),
            "oops": (
                "OOP is a programming style based on objects that combine data and behavior together.",
                (
                    "**OOP** means Object-Oriented Programming.\n\n"
                    "**Main pillars:**\n"
                    "- **Encapsulation**: bind data and methods together\n"
                    "- **Abstraction**: expose only essential behavior\n"
                    "- **Inheritance**: reuse behavior from another class\n"
                    "- **Polymorphism**: same interface, different behavior\n\n"
                    "OOP is useful when modeling real-world entities and building maintainable large applications."
                ),
            ),
        }

        for topic, (short_text, detailed_text) in concept_guides.items():
            if topic in msg_lower:
                return maybe_expand(short_text, detailed_text)

        # Skill suggestions
        if any(w in msg_lower for w in ["suggest", "recommend", "what should i learn", "next skill"]):
            return maybe_expand(
                "Tell me your current skills and goal, and I can recommend the next skill in short.",
                (
                    "To choose the next skill well, use this rule:\n"
                    "1. Pick a goal: placement, freelancing, internships, app building, or research.\n"
                    "2. Strengthen your foundation: DSA, one language, SQL, Git.\n"
                    "3. Add one specialization:\n"
                    "- **Web**: HTML, CSS, JavaScript, React, backend, PostgreSQL\n"
                    "- **AI/Data**: Python, NumPy, Pandas, ML basics, SQL\n"
                    "- **Mobile**: Flutter or Android\n"
                    "- **Cloud/DevOps**: Docker, Linux, CI/CD, AWS\n\n"
                    "If you share your branch, year, and current skills, I can give you a precise short or detailed learning plan."
                ),
            )

        # How to find mentors
        if "mentor" in msg_lower or "find a mentor" in msg_lower:
            return (
                "To find a mentor on TalentConnect:\n"
                "1. Go to the **Skill Exchange** section\n"
                "2. Search for the skill you want to learn\n"
                "3. Browse verified mentors sorted by rating\n"
                "4. Book a session at your preferred time\n\n"
                "All mentors are skill-verified by our AI system!"
            )

        # Task help
        if "task" in msg_lower or "assignment" in msg_lower:
            return (
                "For academic task support:\n"
                "1. Go to the **Task Marketplace**\n"
                "2. Post your task with a description, subject, budget, and deadline\n"
                "3. A skilled student will accept and complete it\n"
                "4. Payment is released only after you approve the work\n\n"
                "All transactions are secured via Razorpay!"
            )

        if any(word in msg_lower for word in ["difference between", "what is", "explain", "how does", "why"]):
            topic = re.sub(
                r"^(what is|explain|how does|why does|why is|why)\s+",
                "",
                user_message.strip(),
                flags=re.IGNORECASE,
            ).rstrip("?")
            topic = self._clean_topic(topic) or "this topic"
            return maybe_expand(
                f"Here is the short idea for **{topic}**: it is best understood through definition, example, and use case.",
                (
                    f"Here is a practical way to understand **{topic}**:\n\n"
                    "1. Start with the definition.\n"
                    "2. See one simple example.\n"
                    "3. Learn where it is used in real projects or interviews.\n"
                    "4. Compare it with related concepts.\n"
                    "5. Practice one or two problems or examples around it.\n\n"
                    f"If you want, ask **{topic} in detail** and I will expand it further."
                ),
            )

        # Default
        topic = self._clean_topic(user_message) or "this topic"
        return maybe_expand(
            f"Here is a short answer about **{topic}**: tell me if you want the detailed version and I will expand it.",
            (
                f"I can help with **{topic}**.\n\n"
                "From a practical learning point of view:\n"
                "1. Break the topic into basics, core concepts, and applications.\n"
                "2. Learn definitions first, then examples, then practice.\n"
                "3. Build or solve something small to check understanding.\n"
                "4. Review common mistakes and interview-style questions.\n\n"
                "If you want, ask the same question again with `in detail`, and I will answer it in a fuller step-by-step format."
            ),
        )

    async def _generate_with_gemini(self, user_message: str, history: List[Dict]) -> Optional[str]:
        if not settings.GEMINI_API_KEY:
            return None

        style = self._response_style(user_message)
        style_prompt = {
            "short": "Give a concise answer in 4-6 lines.",
            "normal": "Give a clear answer with enough detail to be useful.",
            "detailed": "Give a detailed answer with explanation, steps, examples, and structure.",
        }[style]

        system_prompt = (
            "You are TalentConnect AI, a helpful learning assistant. "
            "Answer general education, programming, career, project, and platform questions. "
            "Do not limit yourself only to platform guidance. "
            "If the user asks for short or detailed answers, follow that exactly. "
            "Use markdown bullets or sections when useful, but stay practical and easy to understand. "
            f"{style_prompt}"
        )

        conversation = history[-8:] + [{"role": "user", "content": user_message}]
        transcript = "\n".join(
            f"{item.get('role', 'user').upper()}: {item.get('content', '')}"
            for item in conversation
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": f"{system_prompt}\n\nConversation:\n{transcript}"
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 900 if style == "detailed" else 350,
            },
        }

        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}"
        )

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
            return (
                data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text")
            )
        except Exception:
            return None

    async def _generate_with_groq(self, user_message: str, history: List[Dict]) -> Optional[str]:
        if not settings.GROQ_API_KEY:
            return None

        style = self._response_style(user_message)
        style_prompt = {
            "short": "Give a concise answer in 4-6 lines.",
            "normal": "Give a clear answer with enough detail to be useful.",
            "detailed": "Give a detailed answer with explanation, steps, examples, and structure.",
        }[style]

        messages = [
            {
                "role": "system",
                "content": (
                    "You are TalentConnect AI, a helpful learning assistant. "
                    "Answer general education, programming, career, project, and platform questions. "
                    "Do not limit yourself only to platform guidance. "
                    "If the user asks for short or detailed answers, follow that exactly. "
                    "Stay practical, accurate, and easy to understand. "
                    f"{style_prompt}"
                ),
            }
        ]
        messages.extend(history[-8:])
        messages.append({"role": "user", "content": user_message})

        payload = {
            "model": settings.GROQ_MODEL,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 900 if style == "detailed" else 350,
        }

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
            return data.get("choices", [{}])[0].get("message", {}).get("content")
        except Exception:
            return None

    async def get_response(self, user_message: str, history: List[Dict]) -> str:
        generated = await self._generate_with_gemini(user_message, history)
        if generated and generated.strip():
            return generated.strip()
        generated = await self._generate_with_groq(user_message, history)
        if generated and generated.strip():
            return generated.strip()
        return self._fallback_response(user_message, history)


chatbot = TalentChatbot()
