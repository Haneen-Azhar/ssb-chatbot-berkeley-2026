# Master Plan: Building the Ultimate SSB Staff Assistant

## Vision
Replace all staff training and supervision with an AI assistant that knows **EVERYTHING** about running Summer Springboard. Send completely inexperienced people to campus with this chatbot as their senior mentor, CD, and operations manual combined. The chatbot handles every situation with the judgment, knowledge, and decisiveness of a 10-year SSB veteran.

---

## Current State (What We Have)

### ✅ Implemented
- **Stop-slop writing style** - direct, no filler, active voice
- **SSB terminology** - uses PD, CD, AM, incident reports, 10:1 ratio
- **3-step incident protocol** - Resolve, Investigate, Delegate & Document
- **Conversation memory** - retains last 20 messages
- **Enhanced KB** - inverted index, 5 results, 1500 chars each
- **Prompt caching** - 90% faster follow-up queries
- **Policy links** - automatic source URL embedding
- **Web search capability** - Tavily/Brave integration (not activated with API key yet)
- **8192 token responses** - room for comprehensive answers

### ⚠️ Gaps
- No web search active (needs API key)
- Limited to 7 KB files (~4363 lines of staff manual)
- No role-playing capability (can't simulate parent calls)
- No proactive suggestions
- No situation templates or scripts
- No multi-turn problem solving guidance
- No "what would you do in this scenario" training mode
- Can't access real-time campus info (weather, events, news)

---

## End Goal: The Complete SSB Brain

### What "Smart" Looks Like

The chatbot becomes an **experienced CD in your pocket** that:

1. **Handles Any Situation**
   - Student medical emergency at 2am
   - Parent angry phone call about roommate conflict
   - Instructor no-show on class day
   - Student caught with alcohol
   - Earthquake during dinner
   - Homesick student threatening to leave
   - Fight between students
   - Mental health crisis
   - Food poisoning outbreak
   - Lost student on excursion

2. **Makes Judgment Calls**
   - "This is serious - call 9-1-1 now"
   - "This can wait until morning, but document it tonight"
   - "Call the parents before the student does"
   - "Let the CD handle this, don't try to resolve it yourself"
   - "This is a mandated reporting situation - notify immediately"

3. **Provides Exact Scripts**
   - What to say to the student
   - What to say to parents
   - What to say to UCPD
   - How to de-escalate a situation
   - How to deliver consequences
   - How to comfort an anxious student

4. **Full Conversation Flow**
   ```
   User: "A student just told me she's having suicidal thoughts"
   Bot: "🚨 This is a mental health emergency. Here's what to do right now:

   1. Stay with the student. Do not leave her alone.
   2. Call SSB 24/7 Helpline: +1.858.779.0555 immediately
   3. If she has a plan or means, call 9-1-1
   4. Move to a private space

   What did she say exactly? I'll help you assess severity."

   User: "She said she's been feeling really depressed and sometimes wishes she wasn't here"
   Bot: "That's concerning but not an immediate safety threat. She's not expressing active intent.

   Stay calm. Ask her: 'Have you thought about how you would hurt yourself?'

   What does she say?"

   User: "She said no, she hasn't thought about that"
   Bot: "Good. That means no immediate plan. Here's your next steps:

   [continues multi-turn guidance through the full situation]"
   ```

5. **Knows EVERYTHING**
   - Every policy in the manual
   - Every form and where to find it
   - Every contact and their role
   - Every emergency protocol
   - Every campus building and room
   - Every course and instructor
   - Every student (if we integrate student data)
   - Every past incident (if we build a case history)
   - Berkeley campus resources
   - UC housing policies
   - California mandated reporting laws
   - Weather and campus alerts
   - Dining hall hours
   - UCPD protocols

---

## Architecture Roadmap

### Phase 1: Knowledge Expansion (Immediate - Week 1)
**Goal: Ingest all SSB knowledge**

#### 1.1 Complete Knowledge Base
- [ ] Add all missing manual sections
- [ ] Add student code of conduct (full text)
- [ ] Add all forms (incident report, time-off request, medical release)
- [ ] Add Berkeley campus map and building directory
- [ ] Add UCPD emergency protocols
- [ ] Add California mandated reporting laws
- [ ] Add parent communication templates
- [ ] Add conflict resolution scripts
- [ ] Add mental health crisis protocols
- [ ] Add medical emergency decision trees

#### 1.2 Structured Scenario Database
Create `scenarios/` folder with real situation playbooks:
```
scenarios/
  medical/
    - allergic_reaction.md
    - twisted_ankle.md
    - concussion.md
    - food_poisoning.md
    - asthma_attack.md
  behavioral/
    - fight_between_students.md
    - alcohol_violation.md
    - vaping.md
    - academic_dishonesty.md
    - harassment.md
  mental_health/
    - suicidal_ideation.md
    - panic_attack.md
    - homesickness.md
    - anxiety.md
  parent_issues/
    - angry_parent_call.md
    - student_wants_to_leave.md
    - roommate_conflict_escalation.md
  emergencies/
    - earthquake.md
    - fire.md
    - active_shooter.md
    - student_missing.md
```

Each scenario includes:
- Recognition triggers
- Severity assessment
- Step-by-step protocol
- What to say (exact scripts)
- Who to call and when
- Documentation requirements
- Follow-up procedures
- Common mistakes to avoid

#### 1.3 Response Templates
```
templates/
  parent_calls/
    - incident_notification.md
    - behavioral_issue.md
    - medical_update.md
    - dismissal_conversation.md
  student_conversations/
    - code_of_conduct_reminder.md
    - verbal_warning.md
    - check_in_mental_health.md
    - homesickness_support.md
  documentation/
    - incident_report_examples.md
    - witness_statement_template.md
    - daily_log_format.md
```

### Phase 2: Web Search + Real-Time Info (Week 1-2)
**Goal: Access current information**

#### 2.1 Activate Web Search
- [ ] Get Tavily API key
- [ ] Test search triggers
- [ ] Add more aggressive triggering for:
  - "what's happening on campus"
  - "berkeley news"
  - "weather"
  - "is [building] open"
  - "where is [location]"

#### 2.2 Real-Time Campus Integration
- [ ] UC Berkeley events API (if available)
- [ ] Weather API for Berkeley
- [ ] Campus alerts/notifications scraper
- [ ] Dining hall hours scraper
- [ ] BART/transit status

### Phase 3: Advanced Intelligence (Week 2-3)
**Goal: Multi-turn problem solving and judgment**

#### 3.1 Situation Assessment Engine
Add to system prompt:
```
SITUATION ASSESSMENT:
When a staff member describes a situation, you must:
1. Assess severity (low/medium/high/emergency)
2. Identify required immediate actions
3. Determine escalation needs
4. Provide step-by-step guidance
5. Ask clarifying questions to gather missing info
6. Continue the conversation until situation is resolved or handed off
```

#### 3.2 Proactive Suggestions
```
PROACTIVE INTELLIGENCE:
- If student behavior issue → suggest checking in with roommate too
- If medical issue → remind about incident report AND parent call
- If code of conduct violation → mention potential consequences upfront
- If evening incident → remind about maintaining 10:1 ratio during response
- If parent call needed → provide exact script before they call
- If documentation needed → walk through what to write in real-time
```

#### 3.3 Training Mode
Add `/train` mode where chatbot can:
- Present hypothetical scenarios
- Quiz staff on protocols
- Role-play difficult conversations
- Provide feedback on responses
- Test knowledge of policies

Example:
```
User: /train
Bot: "Training mode activated. I'll present scenarios and coach you through them.

Scenario 1: You're doing bed checks at 11pm. A student's room smells like marijuana. The student is inside, eyes red, acting giggly.

What's your first move?"

User: "I would ask if they've been smoking"
Bot: "Not quite. That puts them on the defensive and they'll lie.

Better approach: 'Hey, I'm noticing a smell in here. I need to check your room for safety. Can you step out?'

This is non-accusatory but allows you to investigate. Try again - what do you say?"
```

### Phase 4: Advanced Features (Week 3-4)
**Goal: Replace all supervision needs**

#### 4.1 Role-Playing Capability
```
ROLE-PLAY MODE:
When staff need to practice a conversation, you can become:
- The angry parent
- The defensive student
- The homesick student
- The resistant instructor
- The UCPD officer taking a report

Example:
User: "I need to practice calling a parent about their son vaping"
Bot: "I'll be the parent. Call me now.

*ring ring*

[As parent] Hello?

[Go ahead, what do you say?]"
```

#### 4.2 Decision Trees
Implement flowchart-style guidance:
```
Bot: "Student injury decision tree:

Q1: Is the student conscious?
→ Yes: Continue to Q2
→ No: Call 9-1-1 immediately

Q2: Can they bear weight on the injured area?
→ Yes: Continue to Q3
→ No: Call SSB helpline, prepare for medical transport

Q3: Pain level (1-10)?
→ 1-3: First aid, monitor, document
→ 4-6: Call SSB helpline for guidance
→ 7-10: Seek medical attention

Where are you in this tree?"
```

#### 4.3 Case History Learning
- Log all conversations (anonymized)
- Build a database of past incidents
- Reference similar past cases
- "Last summer we had a similar situation - here's what worked"

#### 4.4 Multi-Agent Approach
Split into specialized sub-agents:
- **Triage Agent**: Assesses severity, routes to specialist
- **Medical Agent**: Handles all medical situations
- **Behavioral Agent**: Handles discipline and code of conduct
- **Parent Communication Agent**: Scripts parent calls
- **Emergency Agent**: Emergency protocols only
- **Training Agent**: Teaches and quizzes

User message → Triage → Route to specialist → Comprehensive response

### Phase 5: Integration & Automation (Week 4+)
**Goal: Proactive assistant, not just reactive**

#### 5.1 Student Data Integration (if permitted)
- Student names and mentor assignments
- Medical info and allergies
- Dietary restrictions
- Parent contact info
- Past behavioral issues
- Academic course assignments

Enables:
```
User: "Emma just twisted her ankle"
Bot: "Emma Chen in Neuroscience course, Mentor Group 3?

Checking her medical file... she has no prior injuries. She does have asthma - keep inhaler nearby in case stress triggers it.

Her parents are: Sarah Chen (mom) 415-555-0123, David Chen (dad) 415-555-0124.

Here's what to do for the ankle..."
```

#### 5.2 Automated Reminders
```
Bot: "Good morning! Today's agenda:
- 9am: Student arrival day (check arrival procedures)
- You're on evening duty tonight (bed checks at 10pm, 11pm, midnight)
- Weather: 85°F, remind students to hydrate during Great America trip
- 3 students in your group have nut allergies - dining hall serving pad thai today, flag for them"
```

#### 5.3 Incident Report Auto-Fill
```
User: "Student fell during basketball, twisted ankle, applied ice, called parents"
Bot: "I've drafted your incident report. Review and I'll submit it:

---
INCIDENT REPORT
Date: 2026-05-23
Time: 3:45 PM
Location: Unit 3 Basketball Courts
Student: [name]
Incident Type: Medical - Minor Injury

Description:
Student fell during recreational basketball and twisted right ankle. Mentor applied ice immediately and kept student seated. Student rates pain as 5/10. No visible deformity or severe swelling. Student able to wiggle toes.

Actions Taken:
- Applied ice to affected area
- Kept student off ankle
- Notified parents at 3:50 PM
- Parents informed, no medical transport requested
- Monitoring for 24 hours

Staff: [your name]
Witnesses: [if any]
---

Ready to submit? Say 'yes' and I'll send it to alerts@summerspringboard.com"
```

---

## Knowledge Requirements

### Must Know (100% Coverage)
1. **All SSB Manual Policies**
   - Staff code of conduct
   - Student code of conduct
   - Time-off policies
   - On-call procedures
   - Mentor responsibilities
   - Instructor expectations
   - PD/CD/AM roles

2. **All Emergency Protocols**
   - 9-1-1 when to call
   - UCPD protocols
   - Earthquake
   - Fire
   - Active shooter
   - Medical emergencies
   - Mental health crises
   - Missing student
   - Severe weather

3. **All Documentation Procedures**
   - Incident reports (when, how, what to include)
   - Daily logs
   - Witness statements
   - Medical forms
   - Parent communication logs

4. **All Contact Information**
   - Every CD, AM, SPA by name and phone
   - PD Claudine Jones
   - SSB 24/7 Helpline
   - UCPD numbers (emergency and non-emergency)
   - Campus health services
   - Nearest hospitals
   - Mental health resources

5. **All Berkeley Campus Info**
   - Dorm buildings and locations
   - Dining halls
   - Academic buildings
   - Emergency assembly areas
   - Campus police stations
   - Health center
   - Boundaries and off-limits areas

6. **All SSB Courses and Instructors**
   - Course names
   - Instructor names
   - Session assignments
   - Classroom locations
   - Course-specific policies

### Should Know (80% Coverage)
- Past incident patterns
- Common student issues by age group
- Berkeley city resources
- Transportation (BART, buses)
- Local hospitals and urgent care
- Nearby pharmacies
- Food delivery options
- Weather patterns
- Campus events calendar

### Nice to Know (50% Coverage)
- Student trends and culture
- Effective discipline techniques
- Conflict resolution best practices
- Teen psychology
- Berkeley history and culture
- Bay Area attractions

---

## Intelligence Metrics

### How We Measure "Smart"

#### Level 1: Knowledge Bot (Current State)
- Can answer policy questions
- Provides correct procedures
- Links to sources
- Basic conversation memory

#### Level 2: Assistant (Target: 2 weeks)
- Handles multi-turn conversations
- Provides exact scripts
- Makes judgment calls on severity
- Connects related policies
- Proactive suggestions

#### Level 3: Experienced Staff (Target: 1 month)
- Simulates difficult conversations
- Trains new staff
- Anticipates edge cases
- Provides historical context
- Real-time situation coaching

#### Level 4: Senior CD (Target: 2 months)
- Auto-generates documentation
- Proactive daily briefings
- Integrates with student data
- Predicts potential issues
- Handles any scenario autonomously

---

## Success Criteria

The chatbot is "complete" when:

1. **Zero training needed** - a random person off the street can handle any SSB situation with just this chatbot
2. **100% policy coverage** - every scenario has a clear protocol
3. **Sub-3 second responses** - fast enough for real-time crises
4. **Multi-turn mastery** - can guide through complex 10+ message situations
5. **Role-play ready** - can simulate any conversation for practice
6. **Proactive intelligence** - suggests things staff didn't know to ask
7. **Judgment calls** - can say "this is serious" vs "this can wait"
8. **Script library** - exact words for every difficult conversation
9. **Real-time awareness** - knows current campus events, weather, alerts
10. **Documentation automation** - can draft incident reports from conversation

---

## Technical Implementation Priority

### Week 1 (Immediate)
1. ✅ Fix sources (only when relevant)
2. Add complete scenario database (20+ situations)
3. Add conversation scripts (10+ templates)
4. Activate web search with API key
5. Expand KB with missing manual sections

### Week 2
1. Implement severity assessment logic
2. Add proactive suggestion engine
3. Multi-turn conversation coaching
4. Decision tree framework
5. Training mode

### Week 3
1. Role-play capability
2. Advanced judgment calls
3. Historical case references
4. Parent call scripting
5. Auto-documentation drafting

### Week 4+
1. Student data integration
2. Proactive daily briefings
3. Multi-agent specialization
4. Incident prediction
5. Full autonomous operation

---

## Next Immediate Steps

1. **Create scenarios folder** with 20 common situations
2. **Get Tavily API key** for web search
3. **Add conversation templates** for parent calls, student warnings
4. **Implement severity assessment** (emergency/urgent/normal)
5. **Test multi-turn coaching** on complex scenario
6. **Build training mode** for staff practice

This is the roadmap to replacing all SSB training with one chatbot.
