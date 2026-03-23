"""Seed data for training templates."""
import json

TRAINING_TEMPLATES = [
    {
        "slug": "giving-feedback",
        "title": "Giving Difficult Feedback",
        "skill_category": "feedback",
        "description": "Master the SBI framework for delivering clear, actionable feedback without triggering defensiveness.",
        "learning_objectives": [
            "The SBI Model (Situation-Behavior-Impact)",
            "Timing feedback correctly",
            "Separating behavior from personality",
            "Inviting dialogue, not lecturing",
            "Following up effectively"
        ],
        "duration_minutes": 10,
        "difficulty": "beginner",
        "company_context": {
            "company_name": "Horizon Tech",
            "company_description": "A fast-growing B2B SaaS company building project management tools. The team values direct communication and continuous improvement.",
            "scenario_tension": "Jordan, your direct report, has missed the last 3 sprint deadlines. The team is starting to notice, and it's affecting morale. You need to address this before the next sprint planning meeting.",
            "candidate_role": "Product Manager",
            "industry": "Technology"
        },
        "agents": [
            {
                "agent_id": "jordan-chen",
                "name": "Jordan Chen",
                "role": "Junior Developer",
                "relationship_to_candidate": "report",
                "archetype": "standard",
                "persona": "Talented but struggling with deadlines. Generally receptive but can get defensive if feedback feels personal. Responds well to specific examples and clear expectations.",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=JordanChen&backgroundColor=b6e3f4"
            },
            {
                "agent_id": "maya-patel",
                "name": "Maya Patel",
                "role": "Engineering Director",
                "relationship_to_candidate": "manager",
                "archetype": "standard",
                "persona": "Your manager. May check in on how you handled the situation with Jordan. Values direct communication and expects you to handle people issues proactively.",
                "avatar_url": "https://api.dicebear.com/7.x/personas/svg?seed=MayaPatel&backgroundColor=c0aede"
            }
        ],
        "tasks": [
            {
                "task_id": "feedback-convo",
                "title": "Have feedback conversation with Jordan",
                "description": "Address the missed deadlines using the SBI framework",
                "urgency": "high",
                "completion_type": "message"
            },
            {
                "task_id": "update-maya",
                "title": "Update Maya on outcome",
                "description": "Let your manager know how the conversation went",
                "urgency": "medium",
                "completion_type": "message"
            }
        ],
        "inbox": [
            {
                "thread_id": "jordan-thread",
                "from_agent_id": "jordan-chen",
                "subject": "Quick sync?",
                "preview": "Hey, you wanted to chat?",
                "is_urgent": False,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-1",
                        "sender": "agent",
                        "agent_id": "jordan-chen",
                        "content": "Hey, you wanted to chat? What's up?",
                        "timestamp": 1711000000000
                    }
                ]
            }
        ],
        "framework_name": "SBI Model",
        "framework_reference": {
            "title": "SBI Feedback Model",
            "steps": [
                {
                    "letter": "S",
                    "name": "Situation",
                    "description": "Describe WHEN and WHERE it happened. Be specific about the context.",
                    "example": "In yesterday's sprint review..."
                },
                {
                    "letter": "B",
                    "name": "Behavior",
                    "description": "Describe WHAT they did - observable actions, not personality traits or intent.",
                    "example": "...you presented incomplete work without flagging the blockers beforehand..."
                },
                {
                    "letter": "I",
                    "name": "Impact",
                    "description": "Describe the EFFECT on people, team, or work outcomes.",
                    "example": "...which meant the team couldn't plan around it and we missed our deployment window."
                }
            ],
            "pro_tip": "After SBI, ask for their perspective: 'What's your take on this?' This invites dialogue rather than lecturing."
        },
        "coaching_prompts": {
            "vague_criticism": "Try to be more specific. What exact behavior are you referring to?",
            "personality_attack": "Focus on the behavior, not the person. What did they DO?",
            "no_impact": "Good start! Now explain the impact - how did this affect the team or work?",
            "defensive_response": "Jordan seems defensive. Consider acknowledging their perspective before continuing.",
            "good_sbi": "Nice use of the SBI framework! You were specific and focused on behavior."
        }
    },
    {
        "slug": "prioritization",
        "title": "Prioritization Under Pressure",
        "skill_category": "prioritization",
        "description": "Learn to triage tasks effectively when everything feels urgent using the Eisenhower Matrix.",
        "learning_objectives": [
            "The Eisenhower Matrix (Urgent vs Important)",
            "Identifying true urgency vs perceived urgency",
            "Saying no to low-priority requests",
            "Communicating priorities to stakeholders",
            "Managing expectations when overloaded"
        ],
        "duration_minutes": 15,
        "difficulty": "intermediate",
        "company_context": {
            "company_name": "Pulse Analytics",
            "company_description": "A data analytics platform serving enterprise clients. Fast-paced environment with multiple stakeholders and competing priorities.",
            "scenario_tension": "It's Monday morning. You have a product launch on Friday, a client escalation, your manager wants a strategy deck, and two team members need decisions from you. You can't do everything.",
            "candidate_role": "Senior Product Manager",
            "industry": "Technology"
        },
        "agents": [
            {
                "agent_id": "alex-rivera",
                "name": "Alex Rivera",
                "role": "VP of Sales",
                "relationship_to_candidate": "peer",
                "archetype": "difficult",
                "persona": "Pushy and treats everything as urgent. Will escalate quickly if they don't get what they want. Needs to be managed firmly but diplomatically.",
                "avatar_url": "https://api.dicebear.com/7.x/notionists/svg?seed=AlexRivera&backgroundColor=ffd5dc"
            },
            {
                "agent_id": "sam-okonkwo",
                "name": "Sam Okonkwo",
                "role": "Engineering Lead",
                "relationship_to_candidate": "peer",
                "archetype": "standard",
                "persona": "Reasonable and collaborative. Needs decisions to unblock the team. Appreciates clear communication about priorities.",
                "avatar_url": "https://api.dicebear.com/7.x/lorelei/svg?seed=SamOkonkwo&backgroundColor=d1d4f9"
            },
            {
                "agent_id": "priya-sharma",
                "name": "Priya Sharma",
                "role": "Chief Product Officer",
                "relationship_to_candidate": "manager",
                "archetype": "standard",
                "persona": "Your manager. Wants the strategy deck but will understand if you need to reprioritize. Values transparency about workload.",
                "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=PriyaSharma&backgroundColor=ffdfbf"
            }
        ],
        "tasks": [
            {
                "task_id": "client-escalation",
                "title": "Handle client escalation",
                "description": "Enterprise client threatening to churn - Alex needs you",
                "urgency": "high",
                "completion_type": "message"
            },
            {
                "task_id": "launch-decisions",
                "title": "Make launch decisions",
                "description": "Sam needs 3 decisions to unblock Friday's launch",
                "urgency": "high",
                "completion_type": "message"
            },
            {
                "task_id": "strategy-deck",
                "title": "Complete strategy deck",
                "description": "Priya wants it by Wednesday for board prep",
                "urgency": "medium",
                "completion_type": "artifact_edit"
            },
            {
                "task_id": "team-1on1s",
                "title": "Team 1-on-1s",
                "description": "Two direct reports have meetings scheduled today",
                "urgency": "low",
                "completion_type": "message"
            }
        ],
        "inbox": [
            {
                "thread_id": "alex-thread",
                "from_agent_id": "alex-rivera",
                "subject": "URGENT: Client about to churn",
                "preview": "Need you on this NOW",
                "is_urgent": True,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-1",
                        "sender": "agent",
                        "agent_id": "alex-rivera",
                        "content": "Hey, Acme Corp is threatening to cancel their contract. I need you to drop everything and help me put together a save plan. Can you join a call in 30 min?",
                        "timestamp": 1711000000000
                    }
                ]
            },
            {
                "thread_id": "sam-thread",
                "from_agent_id": "sam-okonkwo",
                "subject": "Launch blockers - need decisions",
                "preview": "3 things blocking the team",
                "is_urgent": False,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-2",
                        "sender": "agent",
                        "agent_id": "sam-okonkwo",
                        "content": "Morning! We're blocked on 3 things for Friday's launch: 1) Feature flag naming convention, 2) Error message copy, 3) Default settings for new users. Can you give us direction today?",
                        "timestamp": 1711000100000
                    }
                ]
            },
            {
                "thread_id": "priya-thread",
                "from_agent_id": "priya-sharma",
                "subject": "Strategy deck reminder",
                "preview": "Board meeting prep",
                "is_urgent": False,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-3",
                        "sender": "agent",
                        "agent_id": "priya-sharma",
                        "content": "Hi! Just a reminder that I need the Q2 strategy deck by Wednesday for the board meeting. Let me know if you need any help or if there are blockers.",
                        "timestamp": 1711000200000
                    }
                ]
            }
        ],
        "framework_name": "Eisenhower Matrix",
        "framework_reference": {
            "title": "Eisenhower Matrix",
            "steps": [
                {
                    "letter": "1",
                    "name": "Urgent + Important",
                    "description": "Do these first. Crises, deadlines, emergencies.",
                    "example": "Client about to churn, launch blockers"
                },
                {
                    "letter": "2",
                    "name": "Important + Not Urgent",
                    "description": "Schedule these. Strategic work, planning, relationships.",
                    "example": "Strategy deck, 1-on-1s"
                },
                {
                    "letter": "3",
                    "name": "Urgent + Not Important",
                    "description": "Delegate or do quickly. Interruptions, some meetings.",
                    "example": "Requests that feel urgent but aren't strategic"
                },
                {
                    "letter": "4",
                    "name": "Not Urgent + Not Important",
                    "description": "Eliminate. Time wasters, busy work.",
                    "example": "Low-value tasks you do out of habit"
                }
            ],
            "pro_tip": "Beware the 'mere-urgency effect' - we're drawn to time-sensitive tasks even when less urgent tasks offer greater rewards."
        },
        "coaching_prompts": {
            "trying_to_do_all": "You can't do everything. What's truly most important right now?",
            "no_pushback": "Alex is being pushy, but is this actually the highest priority? Consider pushing back.",
            "good_prioritization": "Good prioritization! You identified what's truly urgent vs what just feels urgent."
        }
    },
    {
        "slug": "crucial-conversations",
        "title": "Crucial Conversations",
        "skill_category": "communication",
        "description": "Navigate high-stakes emotional discussions using the STATE method without damaging relationships.",
        "learning_objectives": [
            "The STATE method for difficult conversations",
            "Creating psychological safety",
            "Separating facts from stories",
            "Inviting dialogue when emotions are high",
            "Finding mutual purpose"
        ],
        "duration_minutes": 12,
        "difficulty": "advanced",
        "company_context": {
            "company_name": "Meridian Consulting",
            "company_description": "A management consulting firm known for its collaborative culture. Teams work closely together on high-stakes client engagements.",
            "scenario_tension": "You discovered that a peer took credit for your work in a leadership presentation. This affected your visibility for promotion. You need to address it without damaging the working relationship.",
            "candidate_role": "Senior Consultant",
            "industry": "Consulting"
        },
        "agents": [
            {
                "agent_id": "chris-martinez",
                "name": "Chris Martinez",
                "role": "Senior Consultant",
                "relationship_to_candidate": "peer",
                "archetype": "difficult",
                "persona": "Ambitious and sometimes takes shortcuts. May not realize the impact of their actions. Can get defensive when confronted but responds to facts and mutual benefit framing.",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=ChrisMartinez&backgroundColor=c0aede"
            },
            {
                "agent_id": "taylor-wong",
                "name": "Taylor Wong",
                "role": "Managing Director",
                "relationship_to_candidate": "manager",
                "archetype": "standard",
                "persona": "Your manager. Unaware of the credit-taking situation. Values both results and team dynamics. Would want to know if there are issues but prefers people to resolve conflicts directly first.",
                "avatar_url": "https://api.dicebear.com/7.x/personas/svg?seed=TaylorWong&backgroundColor=ffdfbf"
            }
        ],
        "tasks": [
            {
                "task_id": "address-chris",
                "title": "Address the situation with Chris",
                "description": "Have a crucial conversation about the presentation credit",
                "urgency": "high",
                "completion_type": "message"
            },
            {
                "task_id": "decide-escalate",
                "title": "Decide whether to involve Taylor",
                "description": "Determine if you need to escalate to your manager",
                "urgency": "medium",
                "completion_type": "message"
            }
        ],
        "inbox": [
            {
                "thread_id": "chris-thread",
                "from_agent_id": "chris-martinez",
                "subject": "Great meeting yesterday!",
                "preview": "Leadership loved the presentation",
                "is_urgent": False,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-1",
                        "sender": "agent",
                        "agent_id": "chris-martinez",
                        "content": "Hey! Leadership loved the presentation yesterday. We should do more of these together. Drinks later to celebrate?",
                        "timestamp": 1711000000000
                    }
                ]
            }
        ],
        "framework_name": "STATE Method",
        "framework_reference": {
            "title": "STATE Method (Crucial Conversations)",
            "steps": [
                {
                    "letter": "S",
                    "name": "Share your facts",
                    "description": "Start with observable facts, not conclusions or accusations.",
                    "example": "In yesterday's presentation, the analysis I created was presented without mentioning my contribution..."
                },
                {
                    "letter": "T",
                    "name": "Tell your story",
                    "description": "Explain what you're starting to conclude (tentatively).",
                    "example": "I'm starting to wonder if there was a misunderstanding about attribution..."
                },
                {
                    "letter": "A",
                    "name": "Ask for others' paths",
                    "description": "Genuinely invite their perspective. They may have a different view.",
                    "example": "I'd like to understand your perspective. What happened from your end?"
                },
                {
                    "letter": "T",
                    "name": "Talk tentatively",
                    "description": "Use language that invites dialogue, not defensiveness.",
                    "example": "I could be wrong, but..." or "I'm curious about..."
                },
                {
                    "letter": "E",
                    "name": "Encourage testing",
                    "description": "Make it safe for them to share, even if they disagree.",
                    "example": "I really want to hear if you see this differently."
                }
            ],
            "pro_tip": "Start with heart: Before the conversation, ask yourself 'What do I really want for myself, for them, and for the relationship?'"
        },
        "coaching_prompts": {
            "accusatory": "That came across as accusatory. Try sharing facts first, not conclusions.",
            "no_perspective_invite": "You haven't asked for their perspective yet. They might have context you're missing.",
            "good_state": "Good use of the STATE method! You shared facts and invited dialogue."
        }
    },
    {
        "slug": "saying-no",
        "title": "Saying No Assertively",
        "skill_category": "assertiveness",
        "description": "Learn to decline requests professionally while maintaining relationships using assertive communication techniques.",
        "learning_objectives": [
            "The difference between passive, aggressive, and assertive",
            "Using 'I' statements effectively",
            "Declining without over-explaining",
            "Offering alternatives when appropriate",
            "Maintaining boundaries under pressure"
        ],
        "duration_minutes": 8,
        "difficulty": "beginner",
        "company_context": {
            "company_name": "Vertex Media",
            "company_description": "A digital media company producing content across multiple platforms. Fast-paced environment with frequent ad-hoc requests.",
            "scenario_tension": "You're already at capacity with a major campaign launch. Your manager is asking you to take on an additional project that would require significant overtime. You need to decline while maintaining the relationship.",
            "candidate_role": "Marketing Manager",
            "industry": "Media"
        },
        "agents": [
            {
                "agent_id": "robin-kelly",
                "name": "Robin Kelly",
                "role": "VP of Marketing",
                "relationship_to_candidate": "manager",
                "archetype": "standard",
                "persona": "Well-meaning but doesn't always see the full picture of your workload. Respects honesty and clear communication. Will push initially but backs off when given good reasons.",
                "avatar_url": "https://api.dicebear.com/7.x/lorelei/svg?seed=RobinKelly&backgroundColor=b6e3f4"
            },
            {
                "agent_id": "jamie-foster",
                "name": "Jamie Foster",
                "role": "Marketing Coordinator",
                "relationship_to_candidate": "report",
                "archetype": "standard",
                "persona": "Your direct report. Eager to help and learn. Could potentially take on some tasks if properly delegated.",
                "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=JamieFoster&backgroundColor=d1d4f9"
            }
        ],
        "tasks": [
            {
                "task_id": "respond-robin",
                "title": "Respond to Robin's request",
                "description": "Decline the additional project assertively",
                "urgency": "high",
                "completion_type": "message"
            },
            {
                "task_id": "offer-alternative",
                "title": "Suggest an alternative solution",
                "description": "Help Robin solve the problem without overcommitting yourself",
                "urgency": "medium",
                "completion_type": "message"
            }
        ],
        "inbox": [
            {
                "thread_id": "robin-thread",
                "from_agent_id": "robin-kelly",
                "subject": "New project - need your help",
                "preview": "Can you take this on?",
                "is_urgent": True,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-1",
                        "sender": "agent",
                        "agent_id": "robin-kelly",
                        "content": "Hey! I know you're busy with the campaign launch, but we just got a request from the CEO for a special brand project. It needs someone experienced, and you're the best person for it. Can you fit this in? It would need about 15 hours this week.",
                        "timestamp": 1711000000000
                    }
                ]
            }
        ],
        "framework_name": "Assertive Communication",
        "framework_reference": {
            "title": "Assertive 'No' Framework",
            "steps": [
                {
                    "letter": "A",
                    "name": "Acknowledge",
                    "description": "Show you understand the request and its importance.",
                    "example": "I understand this project is important and comes from the CEO..."
                },
                {
                    "letter": "D",
                    "name": "Decline clearly",
                    "description": "Say no directly without excessive apologizing or hedging.",
                    "example": "I'm not able to take this on this week..."
                },
                {
                    "letter": "E",
                    "name": "Explain briefly",
                    "description": "Give a short reason without over-justifying.",
                    "example": "...because I'm at capacity with the campaign launch that's due Friday."
                },
                {
                    "letter": "A",
                    "name": "Alternative (optional)",
                    "description": "Offer a different solution if you can.",
                    "example": "Could Jamie take on some aspects with my guidance, or could we revisit next week?"
                }
            ],
            "pro_tip": "You don't need to justify every 'no'. 'I don't have capacity' is a complete reason."
        },
        "coaching_prompts": {
            "over_apologizing": "You're over-apologizing. A clear 'no' with a brief reason is enough.",
            "passive_response": "That response was passive - you agreed when you didn't want to. Try being more direct.",
            "aggressive_response": "That came across as aggressive. Try acknowledging their need first.",
            "good_assertive": "Great assertive response! You were clear and professional."
        }
    }
]


async def seed_training_templates(conn):
    """Seed training templates if they don't exist."""
    for template in TRAINING_TEMPLATES:
        # Check if template exists
        existing = await conn.fetchrow(
            "SELECT template_id FROM training_templates WHERE slug = $1",
            template["slug"]
        )

        if not existing:
            await conn.execute("""
                INSERT INTO training_templates (
                    slug, title, skill_category, description, learning_objectives,
                    duration_minutes, difficulty, company_context, agents, tasks,
                    inbox, framework_name, framework_reference, coaching_prompts
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            """,
                template["slug"],
                template["title"],
                template["skill_category"],
                template["description"],
                json.dumps(template["learning_objectives"]),
                template["duration_minutes"],
                template["difficulty"],
                json.dumps(template["company_context"]),
                json.dumps(template["agents"]),
                json.dumps(template["tasks"]),
                json.dumps(template["inbox"]),
                template["framework_name"],
                json.dumps(template["framework_reference"]),
                json.dumps(template["coaching_prompts"])
            )
            print(f"Seeded training template: {template['title']}")
