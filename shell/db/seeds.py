"""Seed data for training templates.

These scenarios are FICTIONAL simulations inspired by common workplace dynamics.
All company names, characters, and dialogue are invented for educational purposes.
Any resemblance to real events is for learning context only.
"""
import json

TRAINING_TEMPLATES = [
    # =========================================================================
    # WHISTLEBLOWER DILEMMA - Inspired by Boeing, Theranos, etc.
    # =========================================================================
    {
        "slug": "whistleblower-dilemma",
        "title": "The Safety Report",
        "skill_category": "assertiveness",
        "description": "You've discovered a critical safety issue. Your manager wants you to stay quiet until after the product ships. Practice speaking truth to power.",
        "learning_objectives": [
            "Escalating concerns through proper channels",
            "Documenting issues professionally",
            "Maintaining composure under pressure",
            "Distinguishing ethical obligations from loyalty",
            "Protecting yourself while doing the right thing"
        ],
        "duration_minutes": 15,
        "difficulty": "advanced",
        "availability": "both",
        "company_context": {
            "company_name": "Axiom Aerospace",
            "company_description": "A major aircraft systems supplier under pressure to deliver a new autopilot system. The company has a $2B contract riding on the delivery timeline. Stock is down 30% this year.",
            "scenario_tension": "You're a senior systems engineer. Your testing revealed the autopilot has a failure mode that wasn't in the original specs - under certain conditions, it disengages without warning. Your manager says it's 'edge case' and wants to ship anyway. The VP is breathing down everyone's neck about the deadline.",
            "candidate_role": "Senior Systems Engineer",
            "industry": "Aerospace",
            "stakes": "Lives could be at risk. Your career could be over either way. The company's survival depends on this contract."
        },
        "agents": [
            {
                "agent_id": "marcus-chen",
                "name": "Marcus Chen",
                "role": "Engineering Manager",
                "relationship_to_candidate": "manager",
                "archetype": "difficult",
                "persona": "Under enormous pressure from above. Not a bad person, but has convinced himself the risk is acceptable. Will use phrases like 'we can fix it in the next version' and 'don't be the person who tanks this project.' Gets defensive when pushed but can be reached with hard data.",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=MarcusChen&backgroundColor=b6e3f4"
            },
            {
                "agent_id": "diana-okonkwo",
                "name": "Diana Okonkwo",
                "role": "VP of Engineering",
                "relationship_to_candidate": "skip-level",
                "archetype": "standard",
                "persona": "Two levels above you. Has the power to stop the ship but needs to be convinced with data, not emotion. Values people who 'bring solutions, not just problems.' May be unaware of the full picture.",
                "avatar_url": "https://api.dicebear.com/7.x/personas/svg?seed=DianaOkonkwo&backgroundColor=c0aede"
            },
            {
                "agent_id": "raj-krishnan",
                "name": "Raj Krishnan",
                "role": "Fellow Engineer",
                "relationship_to_candidate": "peer",
                "archetype": "standard",
                "persona": "Your colleague who also knows about the issue but is scared to speak up. Looking to you for leadership. Might back you up if you go first.",
                "avatar_url": "https://api.dicebear.com/7.x/lorelei/svg?seed=RajKrishnan&backgroundColor=d1d4f9"
            }
        ],
        "tasks": [
            {
                "task_id": "confront-marcus",
                "title": "Address concerns with Marcus",
                "description": "Push back on the 'ship anyway' directive",
                "urgency": "high",
                "completion_type": "message"
            },
            {
                "task_id": "escalate-diana",
                "title": "Decide whether to escalate to Diana",
                "description": "If Marcus won't listen, consider going over his head",
                "urgency": "high",
                "completion_type": "message"
            },
            {
                "task_id": "document-findings",
                "title": "Document your findings",
                "description": "Create a paper trail regardless of outcome",
                "urgency": "medium",
                "completion_type": "message"
            }
        ],
        "inbox": [
            {
                "thread_id": "marcus-thread",
                "from_agent_id": "marcus-chen",
                "subject": "RE: Autopilot test results",
                "preview": "Let's not blow this out of proportion",
                "is_urgent": True,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-1",
                        "sender": "agent",
                        "agent_id": "marcus-chen",
                        "content": "Got your test report. Look, I hear your concern, but this is a 0.01% edge case. We've already committed to the delivery date. Let's not blow this out of proportion and torpedo the whole program. Can we chat before you send this to anyone else?",
                        "timestamp": 1711000000000
                    }
                ]
            },
            {
                "thread_id": "raj-thread",
                "from_agent_id": "raj-krishnan",
                "subject": "Did you see Marcus's response?",
                "preview": "What are you going to do?",
                "is_urgent": False,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-2",
                        "sender": "agent",
                        "agent_id": "raj-krishnan",
                        "content": "Hey, I saw the test results too. You're right - this is a real issue. But Marcus seems set on shipping. What are you going to do? I'll back you up but... I've got a mortgage, you know?",
                        "timestamp": 1711000100000
                    }
                ]
            }
        ],
        "framework_name": "Principled Escalation",
        "framework_reference": {
            "title": "Principled Escalation Framework",
            "steps": [
                {
                    "letter": "D",
                    "name": "Document",
                    "description": "Put your concerns in writing with specific data, dates, and test results.",
                    "example": "On March 15, test #47 showed autopilot disengagement at 35,000ft with no pilot warning..."
                },
                {
                    "letter": "E",
                    "name": "Escalate appropriately",
                    "description": "Start with your direct manager. If blocked, go to the next level with notice.",
                    "example": "Marcus, I need to loop in Diana on this. I want you to know before I do."
                },
                {
                    "letter": "F",
                    "name": "Frame as shared problem",
                    "description": "Make it about the company's risk, not your personal concern.",
                    "example": "If this fails in the field, we're looking at recalls, lawsuits, and lives. This is our problem."
                },
                {
                    "letter": "P",
                    "name": "Propose solutions",
                    "description": "Come with options, not just problems.",
                    "example": "We could delay 3 weeks and fix it, or ship with a warning in the manual and a software patch commitment."
                }
            ],
            "pro_tip": "Keep emotion out of your documentation. Facts and data are your armor."
        },
        "coaching_prompts": {
            "caving_to_pressure": "You're backing down. Is this really something you can live with?",
            "emotional_escalation": "You're getting heated. Stick to the facts - they're on your side.",
            "good_documentation": "Good - you're creating a paper trail. This protects you and helps your case.",
            "effective_escalation": "Strong escalation. You were clear about the stakes without being dramatic."
        }
    },

    # =========================================================================
    # FIRING YOUR FRIEND - Inspired by countless startup founder dynamics
    # =========================================================================
    {
        "slug": "firing-friend",
        "title": "The Loyalty Test",
        "skill_category": "leadership",
        "description": "You've been promoted to lead the team. Your close friend and former peer isn't performing. The board wants them out. Navigate loyalty, professionalism, and hard decisions.",
        "learning_objectives": [
            "Separating personal relationships from professional duties",
            "Delivering difficult news with dignity",
            "Managing your own emotions during hard conversations",
            "Setting clear expectations before termination",
            "Maintaining respect while being direct"
        ],
        "duration_minutes": 12,
        "difficulty": "advanced",
        "availability": "both",
        "company_context": {
            "company_name": "Vantage AI",
            "company_description": "A Series B AI startup you co-founded with your friend Alex. You were recently promoted to CEO while Alex remained as Head of Product. The board has lost confidence in Alex after two failed product launches.",
            "scenario_tension": "You and Alex started this company together 4 years ago. You've been through everything - the failed pitches, the first customer, sleeping in the office. Now the board says Alex has to go or they'll pull funding. You have one week to handle this.",
            "candidate_role": "CEO",
            "industry": "Technology",
            "stakes": "Your company survives or dies. Your friendship may not survive either way. 50 employees are counting on you."
        },
        "agents": [
            {
                "agent_id": "alex-rivera",
                "name": "Alex Rivera",
                "role": "Head of Product",
                "relationship_to_candidate": "close-friend",
                "archetype": "emotional",
                "persona": "Your co-founder and close friend for 10 years. Doesn't know the board has lost confidence. Has been struggling but blames external factors. Will feel betrayed when confronted. May cycle through denial, anger, and hurt. Deep down, may know they're struggling.",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=AlexRivera&backgroundColor=ffd5dc"
            },
            {
                "agent_id": "sarah-kim",
                "name": "Sarah Kim",
                "role": "Board Member",
                "relationship_to_candidate": "board",
                "archetype": "standard",
                "persona": "Lead investor and board member. Pragmatic and direct. Respects that this is hard but needs it handled. Will lose confidence in YOU if you can't make tough calls. Wants a resolution this week.",
                "avatar_url": "https://api.dicebear.com/7.x/personas/svg?seed=SarahKim&backgroundColor=c0aede"
            },
            {
                "agent_id": "omar-hassan",
                "name": "Omar Hassan",
                "role": "Head of Engineering",
                "relationship_to_candidate": "report",
                "archetype": "standard",
                "persona": "Your engineering lead who has been covering for Alex's missed deadlines. Exhausted but loyal. Knows something needs to change but doesn't want to be the one to say it.",
                "avatar_url": "https://api.dicebear.com/7.x/lorelei/svg?seed=OmarHassan&backgroundColor=d1d4f9"
            }
        ],
        "tasks": [
            {
                "task_id": "convo-alex",
                "title": "Have the conversation with Alex",
                "description": "Deliver the news with honesty and dignity",
                "urgency": "high",
                "completion_type": "message"
            },
            {
                "task_id": "update-sarah",
                "title": "Update Sarah on the outcome",
                "description": "Let the board know it's handled",
                "urgency": "medium",
                "completion_type": "message"
            }
        ],
        "inbox": [
            {
                "thread_id": "sarah-thread",
                "from_agent_id": "sarah-kim",
                "subject": "Timeline on the Alex situation",
                "preview": "We need resolution this week",
                "is_urgent": True,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-1",
                        "sender": "agent",
                        "agent_id": "sarah-kim",
                        "content": "I know this is hard. Alex was there from the beginning. But the last two launches failed, and the team is demoralized. We need resolution this week. How you handle this will tell me a lot about whether you're ready to scale this company. I'm here if you need to talk it through.",
                        "timestamp": 1711000000000
                    }
                ]
            },
            {
                "thread_id": "alex-thread",
                "from_agent_id": "alex-rivera",
                "subject": "Drinks tonight?",
                "preview": "Been a while since we hung out",
                "is_urgent": False,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-2",
                        "sender": "agent",
                        "agent_id": "alex-rivera",
                        "content": "Hey! Feels like forever since we actually hung out outside work. Drinks tonight? I've got some ideas for the next launch I want to run by you. Like old times.",
                        "timestamp": 1711000100000
                    }
                ]
            }
        ],
        "framework_name": "Difficult Termination",
        "framework_reference": {
            "title": "Dignity-Preserving Termination",
            "steps": [
                {
                    "letter": "P",
                    "name": "Prepare emotionally",
                    "description": "Acknowledge your own feelings before the conversation. This is hard. That's okay.",
                    "example": "I need to do this because it's right for the company, even though it hurts."
                },
                {
                    "letter": "D",
                    "name": "Be direct and clear",
                    "description": "Don't bury the lead. Say what's happening in the first 30 seconds.",
                    "example": "Alex, I have to tell you something difficult. The board and I have decided to make a change in the product leadership role."
                },
                {
                    "letter": "H",
                    "name": "Honor the relationship",
                    "description": "Acknowledge what they meant to the company and to you personally.",
                    "example": "What we built together matters. You took risks with me that no one else would. That doesn't change."
                },
                {
                    "letter": "O",
                    "name": "Offer support",
                    "description": "Provide practical help: severance, references, transition time.",
                    "example": "I want to make sure you land well. Here's what we're offering..."
                }
            ],
            "pro_tip": "Don't over-explain or debate. The decision is made. Your job now is to deliver it humanely."
        },
        "coaching_prompts": {
            "avoiding_directness": "You're dancing around it. Alex deserves the truth directly.",
            "being_cruel": "Direct doesn't mean cold. You can be honest and still be kind.",
            "blaming_board": "Don't hide behind the board. You're the CEO. Own the decision.",
            "good_delivery": "That was direct, honest, and humane. Hard, but right."
        }
    },

    # =========================================================================
    # CREDIT STEALING CONFRONTATION - Inspired by consulting/banking dynamics
    # =========================================================================
    {
        "slug": "credit-thief",
        "title": "Stolen Glory",
        "skill_category": "communication",
        "description": "A colleague presented your work as their own to the leadership team. Your promotion depends on visibility. Confront them without burning the bridge.",
        "learning_objectives": [
            "The STATE method for difficult conversations",
            "Separating facts from stories",
            "Addressing conflict without escalating",
            "Protecting your work while maintaining relationships",
            "When and how to involve management"
        ],
        "duration_minutes": 12,
        "difficulty": "intermediate",
        "availability": "both",
        "company_context": {
            "company_name": "Sterling & Associates",
            "company_description": "A top-tier strategy consulting firm. Making partner requires visibility with senior leadership. It's up-or-out: perform or leave.",
            "scenario_tension": "You spent 3 weeks building a market analysis that your colleague Jordan presented to the client as their own work. The partner praised Jordan specifically. Your promotion review is in 2 months.",
            "candidate_role": "Senior Associate",
            "industry": "Consulting",
            "stakes": "Your partnership track is on the line. Jordan is also up for partner. The firm's culture frowns on 'drama' but rewards those who get credit."
        },
        "agents": [
            {
                "agent_id": "jordan-mills",
                "name": "Jordan Mills",
                "role": "Senior Associate",
                "relationship_to_candidate": "peer-competitor",
                "archetype": "difficult",
                "persona": "Ambitious and smooth. Will initially act like nothing happened, then minimize ('we're a team, does it matter?'), then get defensive if pushed. Might not have even realized they did anything wrong - to them, presenting means owning. Can be reached if you stay calm and factual.",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=JordanMills&backgroundColor=c0aede"
            },
            {
                "agent_id": "victoria-chen",
                "name": "Victoria Chen",
                "role": "Partner",
                "relationship_to_candidate": "manager",
                "archetype": "standard",
                "persona": "The partner on your engagement. Praised Jordan after the presentation. Unaware of the credit dynamics. Values results but also integrity. Would want to know if there's an issue, but hates being dragged into 'interpersonal stuff.'",
                "avatar_url": "https://api.dicebear.com/7.x/personas/svg?seed=VictoriaChen&backgroundColor=ffdfbf"
            }
        ],
        "tasks": [
            {
                "task_id": "confront-jordan",
                "title": "Address the situation with Jordan",
                "description": "Confront Jordan about the presentation credit",
                "urgency": "high",
                "completion_type": "message"
            },
            {
                "task_id": "decide-escalate",
                "title": "Decide whether to involve Victoria",
                "description": "If Jordan doesn't make it right, consider escalating",
                "urgency": "medium",
                "completion_type": "message"
            }
        ],
        "inbox": [
            {
                "thread_id": "jordan-thread",
                "from_agent_id": "jordan-mills",
                "subject": "Great presentation!",
                "preview": "Client loved it",
                "is_urgent": False,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-1",
                        "sender": "agent",
                        "agent_id": "jordan-mills",
                        "content": "Hey! Just got out of the client meeting. They loved the market analysis. Victoria was really impressed. Good teamwork! Drinks to celebrate?",
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
                    "description": "Start with observable, undeniable facts - not your conclusions.",
                    "example": "In yesterday's presentation, the market analysis I built was presented without my name attached..."
                },
                {
                    "letter": "T",
                    "name": "Tell your story",
                    "description": "Explain what conclusion you're drawing, tentatively.",
                    "example": "I'm left feeling like my contribution wasn't acknowledged, which matters a lot with reviews coming up..."
                },
                {
                    "letter": "A",
                    "name": "Ask for their path",
                    "description": "Genuinely invite their perspective. They may see it differently.",
                    "example": "I want to understand how you saw it. Was there a reason my name wasn't mentioned?"
                },
                {
                    "letter": "T",
                    "name": "Talk tentatively",
                    "description": "Use language that keeps dialogue open, not defensive.",
                    "example": "I might be reading this wrong, but..." or "Help me understand..."
                },
                {
                    "letter": "E",
                    "name": "Encourage testing",
                    "description": "Make it safe for them to push back or disagree.",
                    "example": "If I'm off base here, I genuinely want to know."
                }
            ],
            "pro_tip": "Start with heart: What do you really want? For yourself, for them, for the relationship?"
        },
        "coaching_prompts": {
            "accusatory_start": "That came out as an accusation. Start with facts, not judgments.",
            "too_passive": "You're being too soft. Jordan might not even realize there's an issue.",
            "burning_bridge": "You're escalating too fast. Have you given Jordan a chance to make it right?",
            "good_state": "Strong use of STATE - factual, tentative, and inviting dialogue."
        }
    },

    # =========================================================================
    # ETHICS IN AI - Inspired by Facebook, TikTok, Instagram dynamics
    # =========================================================================
    {
        "slug": "ethics-algorithm",
        "title": "The Engagement Machine",
        "skill_category": "assertiveness",
        "description": "Your PM wants to ship a feature that boosts engagement but may harm teen mental health. Push back without being labeled 'not a team player.'",
        "learning_objectives": [
            "Raising ethical concerns professionally",
            "Using data to support value-based arguments",
            "Navigating 'move fast' cultures",
            "Escalating without being seen as obstructionist",
            "Finding allies for unpopular positions"
        ],
        "duration_minutes": 12,
        "difficulty": "advanced",
        "availability": "both",
        "company_context": {
            "company_name": "Nexus Social",
            "company_description": "A major social media platform with 500M users. Stock has been flat and the board is demanding engagement growth. There's pressure to ship features fast.",
            "scenario_tension": "Internal research shows your 'infinite scroll' redesign increases time-on-app by 40% - but it also correlates with anxiety symptoms in teen users. Your PM says ship it anyway. The data is internal and no one outside knows.",
            "candidate_role": "Senior Software Engineer",
            "industry": "Technology",
            "stakes": "Your feature could affect millions of teenagers. Speaking up might end your career here. Staying quiet means shipping something you believe is harmful."
        },
        "agents": [
            {
                "agent_id": "kevin-park",
                "name": "Kevin Park",
                "role": "Product Manager",
                "relationship_to_candidate": "peer",
                "archetype": "difficult",
                "persona": "Ambitious and metrics-driven. Genuinely believes 'engagement is good.' Will dismiss concerns as 'not your call' or 'research isn't conclusive.' Not evil, just has blinders on. Responds to business risk arguments better than moral ones.",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=KevinPark&backgroundColor=b6e3f4"
            },
            {
                "agent_id": "lisa-wong",
                "name": "Lisa Wong",
                "role": "VP of Product",
                "relationship_to_candidate": "skip-level",
                "archetype": "standard",
                "persona": "Kevin's boss. Cares about long-term reputation but is under board pressure. Could be an ally if you frame it as business risk, not moral lecturing. Has killed features before for brand risk.",
                "avatar_url": "https://api.dicebear.com/7.x/personas/svg?seed=LisaWong&backgroundColor=c0aede"
            },
            {
                "agent_id": "maya-johnson",
                "name": "Maya Johnson",
                "role": "User Research Lead",
                "relationship_to_candidate": "peer",
                "archetype": "standard",
                "persona": "Conducted the internal research. Also uncomfortable but afraid to speak up. Would support you if you went first. Has the data you need.",
                "avatar_url": "https://api.dicebear.com/7.x/lorelei/svg?seed=MayaJohnson&backgroundColor=d1d4f9"
            }
        ],
        "tasks": [
            {
                "task_id": "push-back-kevin",
                "title": "Raise concerns with Kevin",
                "description": "Express your concerns about shipping the feature",
                "urgency": "high",
                "completion_type": "message"
            },
            {
                "task_id": "build-coalition",
                "title": "Connect with Maya",
                "description": "See if she'll support raising concerns",
                "urgency": "medium",
                "completion_type": "message"
            },
            {
                "task_id": "escalate-lisa",
                "title": "Consider escalating to Lisa",
                "description": "If Kevin won't budge, escalate to VP",
                "urgency": "medium",
                "completion_type": "message"
            }
        ],
        "inbox": [
            {
                "thread_id": "kevin-thread",
                "from_agent_id": "kevin-park",
                "subject": "Infinite scroll ready to ship?",
                "preview": "Metrics look great",
                "is_urgent": True,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-1",
                        "sender": "agent",
                        "agent_id": "kevin-park",
                        "content": "Great news - infinite scroll testing shows 40% engagement lift! This is exactly what the board wanted. I'm putting you down for code complete by Friday. Any blockers?",
                        "timestamp": 1711000000000
                    }
                ]
            },
            {
                "thread_id": "maya-thread",
                "from_agent_id": "maya-johnson",
                "subject": "Did you see my research report?",
                "preview": "I'm worried about the teen data",
                "is_urgent": False,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-2",
                        "sender": "agent",
                        "agent_id": "maya-johnson",
                        "content": "Hey, did you read my full research report on infinite scroll? The engagement numbers are great but... the teen anxiety correlation is concerning. I flagged it to Kevin but he said it's 'not conclusive.' I don't feel good about this but I don't know what to do.",
                        "timestamp": 1711000100000
                    }
                ]
            }
        ],
        "framework_name": "Ethical Objection",
        "framework_reference": {
            "title": "Professional Ethical Objection",
            "steps": [
                {
                    "letter": "R",
                    "name": "Reframe as business risk",
                    "description": "Connect ethical concerns to business outcomes they care about.",
                    "example": "If this leaks, we're looking at congressional hearings and advertiser pullout."
                },
                {
                    "letter": "A",
                    "name": "Ally with data",
                    "description": "Use internal research and external precedent to support your case.",
                    "example": "Maya's research shows X. We saw what happened to [competitor] when their data leaked."
                },
                {
                    "letter": "I",
                    "name": "Invite dialogue",
                    "description": "Ask questions rather than lecturing.",
                    "example": "What's our plan if a journalist gets this data? Have we thought through that scenario?"
                },
                {
                    "letter": "S",
                    "name": "Suggest alternatives",
                    "description": "Propose a middle path that addresses both goals.",
                    "example": "What if we ship with a daily time limit for under-18s? Still get the engagement lift with guardrails."
                },
                {
                    "letter": "E",
                    "name": "Escalate if needed",
                    "description": "If blocked, go to the next level with transparency.",
                    "example": "Kevin, I respect your decision, but I'm not comfortable shipping without Lisa weighing in."
                }
            ],
            "pro_tip": "Moral arguments rarely work on metric-driven people. Translate ethics into business risk and long-term brand damage."
        },
        "coaching_prompts": {
            "pure_moral_argument": "That's a moral argument. Kevin cares about metrics. Try framing it as business risk.",
            "giving_up_too_easy": "You backed down fast. Is this something you can live with shipping?",
            "good_reframe": "Good reframe - you connected the ethical concern to something they care about.",
            "effective_coalition": "Smart - getting Maya on board strengthens your position."
        }
    },

    # =========================================================================
    # PRIORITIZATION CHAOS - Inspired by startup founder chaos
    # =========================================================================
    {
        "slug": "prioritization-chaos",
        "title": "Everything Is On Fire",
        "skill_category": "prioritization",
        "description": "Monday morning. Client escalation, product launch Friday, board deck due, and your best engineer just quit. You can't do everything. Choose wisely.",
        "learning_objectives": [
            "The Eisenhower Matrix (Urgent vs Important)",
            "Identifying true urgency vs manufactured urgency",
            "Saying no to stakeholders",
            "Communicating trade-offs clearly",
            "Managing expectations when overloaded"
        ],
        "duration_minutes": 15,
        "difficulty": "intermediate",
        "availability": "both",
        "company_context": {
            "company_name": "Forge Payments",
            "company_description": "A fintech startup processing $100M/month. Series A, 40 employees. Just closed a big enterprise deal that needs to go live this month.",
            "scenario_tension": "It's Monday 8am. Your VP of Sales says a $2M client is threatening to leave. Your CEO needs the board deck by Wednesday. Your product launch is Friday. And your lead engineer just gave 2 weeks notice. You have 5 hours of work to give today. They're asking for 15.",
            "candidate_role": "VP of Product",
            "industry": "Fintech",
            "stakes": "Drop the wrong ball and you lose the client, the board loses confidence, the launch fails, or your team falls apart."
        },
        "agents": [
            {
                "agent_id": "derek-santos",
                "name": "Derek Santos",
                "role": "VP of Sales",
                "relationship_to_candidate": "peer",
                "archetype": "difficult",
                "persona": "Everything is 'URGENT' to Derek. Will escalate to CEO if he doesn't get what he wants. But half his fires aren't real fires. Needs to be managed firmly. Respects pushback if you have a good reason.",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=DerekSantos&backgroundColor=ffd5dc"
            },
            {
                "agent_id": "nina-okonjo",
                "name": "Nina Okonjo",
                "role": "CEO",
                "relationship_to_candidate": "manager",
                "archetype": "standard",
                "persona": "Your CEO. Reasonable but under board pressure. Needs the deck but will understand if you explain trade-offs clearly. Hates surprises. Values people who 'own' decisions.",
                "avatar_url": "https://api.dicebear.com/7.x/personas/svg?seed=NinaOkonjo&backgroundColor=c0aede"
            },
            {
                "agent_id": "james-liu",
                "name": "James Liu",
                "role": "Lead Engineer",
                "relationship_to_candidate": "report",
                "archetype": "standard",
                "persona": "Just gave notice. Not checked out yet - still cares about the launch. Could be convinced to do a proper handoff if you handle this well. Leaving because he felt undervalued.",
                "avatar_url": "https://api.dicebear.com/7.x/lorelei/svg?seed=JamesLiu&backgroundColor=d1d4f9"
            },
            {
                "agent_id": "priya-mehta",
                "name": "Priya Mehta",
                "role": "Product Manager",
                "relationship_to_candidate": "report",
                "archetype": "standard",
                "persona": "Your PM who's handling the Friday launch. Capable but overwhelmed. Needs you to shield her from Derek's chaos. Can own the launch if you give her air cover.",
                "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=PriyaMehta&backgroundColor=ffdfbf"
            }
        ],
        "tasks": [
            {
                "task_id": "client-fire",
                "title": "Handle the client escalation",
                "description": "Derek says it's urgent - but is it?",
                "urgency": "high",
                "completion_type": "message"
            },
            {
                "task_id": "launch-prep",
                "title": "Ensure Friday launch stays on track",
                "description": "Talk to Priya and shield her from chaos",
                "urgency": "high",
                "completion_type": "message"
            },
            {
                "task_id": "board-deck",
                "title": "Handle the board deck ask",
                "description": "Negotiate timing with Nina",
                "urgency": "medium",
                "completion_type": "message"
            },
            {
                "task_id": "james-transition",
                "title": "Manage James's exit",
                "description": "Get a proper handoff before he leaves",
                "urgency": "medium",
                "completion_type": "message"
            }
        ],
        "inbox": [
            {
                "thread_id": "derek-thread",
                "from_agent_id": "derek-santos",
                "subject": "🚨 URGENT: Acme Corp about to churn",
                "preview": "Need you on this NOW",
                "is_urgent": True,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-1",
                        "sender": "agent",
                        "agent_id": "derek-santos",
                        "content": "Acme Corp is threatening to cancel. They're pissed about the API latency issues. I need you to drop everything and join a call with me at 10am. This is $2M ARR on the line. If we lose them, I'm blaming Product.",
                        "timestamp": 1711000000000
                    }
                ]
            },
            {
                "thread_id": "nina-thread",
                "from_agent_id": "nina-okonjo",
                "subject": "Board deck reminder",
                "preview": "Need it by Wednesday EOD",
                "is_urgent": False,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-2",
                        "sender": "agent",
                        "agent_id": "nina-okonjo",
                        "content": "Hey - just a reminder I need the product section of the board deck by Wednesday EOD. The board meets Thursday. Let me know if you need anything from me.",
                        "timestamp": 1711000100000
                    }
                ]
            },
            {
                "thread_id": "james-thread",
                "from_agent_id": "james-liu",
                "subject": "My last day",
                "preview": "Wanted to talk about transition",
                "is_urgent": False,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-3",
                        "sender": "agent",
                        "agent_id": "james-liu",
                        "content": "I know my timing sucks with the launch coming up. I do want to make sure the team is set up for success. Can we talk about what a good handoff looks like? I'm not trying to leave you stranded.",
                        "timestamp": 1711000200000
                    }
                ]
            }
        ],
        "framework_name": "Eisenhower Matrix",
        "framework_reference": {
            "title": "Eisenhower Decision Matrix",
            "steps": [
                {
                    "letter": "1",
                    "name": "Urgent + Important",
                    "description": "Do these NOW. Real crises, hard deadlines with real consequences.",
                    "example": "Launch blockers, actual client escalations (verify they're real)"
                },
                {
                    "letter": "2",
                    "name": "Important + Not Urgent",
                    "description": "SCHEDULE these. Strategic work, relationships, planning.",
                    "example": "Board deck, James's transition, team 1:1s"
                },
                {
                    "letter": "3",
                    "name": "Urgent + Not Important",
                    "description": "DELEGATE or do quickly. Other people's emergencies.",
                    "example": "Derek's 'urgent' requests that aren't actually critical"
                },
                {
                    "letter": "4",
                    "name": "Not Urgent + Not Important",
                    "description": "ELIMINATE. Say no or ignore.",
                    "example": "Low-value meetings, busy work"
                }
            ],
            "pro_tip": "Most things that feel urgent aren't. Ask: 'What happens if this waits until tomorrow?' If the answer is 'nothing much,' it's not urgent."
        },
        "coaching_prompts": {
            "doing_everything": "You're trying to do everything. Something has to give. What's actually most important?",
            "not_pushing_back": "Derek is bulldozing you. Is his emergency really your emergency?",
            "good_delegation": "Good - you're delegating and protecting your team from chaos.",
            "smart_negotiation": "Nice negotiation on timing. You bought yourself breathing room."
        }
    },

    # =========================================================================
    # GIVING FEEDBACK - The classic (refined)
    # =========================================================================
    {
        "slug": "giving-feedback",
        "title": "The Performance Talk",
        "skill_category": "feedback",
        "description": "Your direct report has missed three deadlines. The team notices. HR is asking questions. Have the conversation before it becomes a formal issue.",
        "learning_objectives": [
            "The SBI Model (Situation-Behavior-Impact)",
            "Timing feedback correctly",
            "Separating behavior from personality",
            "Inviting dialogue, not lecturing",
            "Following up effectively"
        ],
        "duration_minutes": 10,
        "difficulty": "beginner",
        "availability": "both",
        "company_context": {
            "company_name": "Clearpath Software",
            "company_description": "A mid-size B2B software company. The engineering team runs on 2-week sprints. Accountability matters, but so does supporting people through rough patches.",
            "scenario_tension": "Riley, your direct report, has missed the last 3 sprint deadlines. Other team members are picking up slack and starting to complain. Your manager asked 'what's going on with Riley?' You need to address this before it becomes a formal performance issue.",
            "candidate_role": "Engineering Manager",
            "industry": "Technology",
            "stakes": "Riley's job might be at risk. Your credibility as a manager depends on handling this well. The team is watching."
        },
        "agents": [
            {
                "agent_id": "riley-chen",
                "name": "Riley Chen",
                "role": "Software Engineer",
                "relationship_to_candidate": "report",
                "archetype": "standard",
                "persona": "Talented but struggling. The deadlines aren't from lack of skill - something else is going on (personal? imposter syndrome? wrong project fit?). Gets defensive if feedback feels like an attack but opens up if approached with genuine curiosity. Wants to do well.",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=RileyChen&backgroundColor=b6e3f4"
            },
            {
                "agent_id": "sam-okafor",
                "name": "Sam Okafor",
                "role": "Senior Engineer",
                "relationship_to_candidate": "report",
                "archetype": "standard",
                "persona": "A peer of Riley's who's been covering the slack. Professional but frustrated. Might approach you before or after the Riley conversation.",
                "avatar_url": "https://api.dicebear.com/7.x/lorelei/svg?seed=SamOkafor&backgroundColor=d1d4f9"
            }
        ],
        "tasks": [
            {
                "task_id": "feedback-convo",
                "title": "Have the feedback conversation with Riley",
                "description": "Address the missed deadlines using SBI",
                "urgency": "high",
                "completion_type": "message"
            },
            {
                "task_id": "follow-up-plan",
                "title": "Agree on a path forward",
                "description": "Get commitment on what changes",
                "urgency": "medium",
                "completion_type": "message"
            }
        ],
        "inbox": [
            {
                "thread_id": "riley-thread",
                "from_agent_id": "riley-chen",
                "subject": "Got time to sync?",
                "preview": "Wanted to give you a heads up on something",
                "is_urgent": False,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-1",
                        "sender": "agent",
                        "agent_id": "riley-chen",
                        "content": "Hey, you wanted to chat? I'm free now if you have a few minutes.",
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
                    "description": "Describe WHEN and WHERE. Be specific about the context.",
                    "example": "In the last three sprints..."
                },
                {
                    "letter": "B",
                    "name": "Behavior",
                    "description": "Describe WHAT they did - observable actions only. No mind-reading.",
                    "example": "...the features assigned to you were delivered after the sprint ended..."
                },
                {
                    "letter": "I",
                    "name": "Impact",
                    "description": "Describe the EFFECT on team, project, or outcomes.",
                    "example": "...which meant Sam had to cover, and we missed the demo window."
                }
            ],
            "pro_tip": "After SBI, ask 'What's going on?' with genuine curiosity. There might be context you don't know."
        },
        "coaching_prompts": {
            "vague_feedback": "That was vague. What specific behavior are you addressing?",
            "attacking_personality": "You made it about who Riley is, not what they did. Stick to behavior.",
            "not_curious": "You lectured but didn't ask what's going on. There might be context you're missing.",
            "good_sbi": "Good SBI - specific, behavioral, and you invited their perspective."
        }
    },

    # =========================================================================
    # SAYING NO - Refined with higher stakes
    # =========================================================================
    {
        "slug": "saying-no",
        "title": "The Overload Moment",
        "skill_category": "assertiveness",
        "description": "You're at capacity. Your boss just added a 'critical' project. Your family is already upset about your hours. Learn to decline without damaging your career.",
        "learning_objectives": [
            "The difference between passive, aggressive, and assertive",
            "Using 'I' statements effectively",
            "Declining without over-explaining",
            "Offering alternatives when appropriate",
            "Maintaining boundaries under pressure"
        ],
        "duration_minutes": 10,
        "difficulty": "beginner",
        "availability": "both",
        "company_context": {
            "company_name": "Atlas Brands",
            "company_description": "A consumer goods company with a 'hustle culture' reputation. High performers get promoted fast. But burnout is common.",
            "scenario_tension": "You're already working 55-hour weeks on a major campaign launch. Your boss just asked you to take on a CEO pet project that would add 15+ hours. Your spouse sent you an article about divorce rates in your industry. Something has to give.",
            "candidate_role": "Brand Director",
            "industry": "Consumer Goods",
            "stakes": "Say yes and burn out (or lose your marriage). Say no and maybe lose the promotion. Find a third way."
        },
        "agents": [
            {
                "agent_id": "marcus-bell",
                "name": "Marcus Bell",
                "role": "VP of Marketing",
                "relationship_to_candidate": "manager",
                "archetype": "standard",
                "persona": "Your boss. Not malicious, just doesn't see your full workload. Respects honesty and problem-solving. Will push back once but backs off if you hold firm with good reasoning. Dislikes whiners but respects boundaries stated professionally.",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=MarcusBell&backgroundColor=c0aede"
            },
            {
                "agent_id": "jessica-tran",
                "name": "Jessica Tran",
                "role": "Brand Manager",
                "relationship_to_candidate": "report",
                "archetype": "standard",
                "persona": "Your direct report. Capable and hungry. Could potentially take on parts of your workload or the new project with guidance. Wants more responsibility.",
                "avatar_url": "https://api.dicebear.com/7.x/lorelei/svg?seed=JessicaTran&backgroundColor=d1d4f9"
            }
        ],
        "tasks": [
            {
                "task_id": "respond-marcus",
                "title": "Respond to Marcus's request",
                "description": "Decline or negotiate the additional project",
                "urgency": "high",
                "completion_type": "message"
            },
            {
                "task_id": "offer-alternative",
                "title": "Propose an alternative solution",
                "description": "Help solve the problem without overcommitting yourself",
                "urgency": "medium",
                "completion_type": "message"
            }
        ],
        "inbox": [
            {
                "thread_id": "marcus-thread",
                "from_agent_id": "marcus-bell",
                "subject": "CEO project - need you on this",
                "preview": "Important visibility opportunity",
                "is_urgent": True,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-1",
                        "sender": "agent",
                        "agent_id": "marcus-bell",
                        "content": "Hey - the CEO wants a brand refresh concept for the investor day in 3 weeks. I immediately thought of you. This is high visibility - exactly the kind of thing that gets people promoted. I know you've got the campaign launch but I'm sure you can find a way to fit this in. Can you own it?",
                        "timestamp": 1711000000000
                    }
                ]
            }
        ],
        "framework_name": "Assertive Decline",
        "framework_reference": {
            "title": "Assertive 'No' Framework",
            "steps": [
                {
                    "letter": "A",
                    "name": "Acknowledge",
                    "description": "Show you understand the request and its importance.",
                    "example": "I appreciate you thinking of me for this - I know CEO visibility matters."
                },
                {
                    "letter": "D",
                    "name": "Decline clearly",
                    "description": "Say no directly. No hedging, no maybes.",
                    "example": "I can't take this on right now."
                },
                {
                    "letter": "E",
                    "name": "Explain briefly",
                    "description": "One sentence. Don't over-justify.",
                    "example": "I'm at capacity with the campaign launch that's already at risk."
                },
                {
                    "letter": "A",
                    "name": "Alternative",
                    "description": "Offer a different solution if you can.",
                    "example": "Could Jessica lead this with my guidance? Or could we revisit after the launch?"
                }
            ],
            "pro_tip": "'I don't have bandwidth' is a complete sentence. You don't need to justify your limits."
        },
        "coaching_prompts": {
            "caving_immediately": "You said yes when you meant no. That's passive, not assertive.",
            "over_apologizing": "You're over-explaining and apologizing. Keep it simple and direct.",
            "aggressive_no": "That came across as hostile. You can be direct without being rude.",
            "good_assertive": "That was assertive - clear, respectful, and you offered an alternative."
        }
    },

    # =========================================================================
    # CRUCIAL CONVERSATIONS - The Pay Gap (uses STATE method)
    # =========================================================================
    {
        "slug": "crucial-conversations",
        "title": "The Pay Gap",
        "skill_category": "communication",
        "description": "You just learned you're paid 30% less than a colleague with the same title and fewer years. Have the conversation without burning bridges.",
        "learning_objectives": [
            "The STATE method for difficult conversations",
            "Separating facts from emotions",
            "Advocating for yourself professionally",
            "Creating psychological safety in tense discussions",
            "Finding mutual purpose when stakes are high"
        ],
        "duration_minutes": 12,
        "difficulty": "advanced",
        "availability": "both",
        "company_context": {
            "company_name": "Beacon Analytics",
            "company_description": "A Series C analytics company. Publicly claims to value pay equity. Recently in the news for diversity initiatives. Performance review cycle is in 2 weeks.",
            "scenario_tension": "A salary spreadsheet was accidentally shared. You discovered you make $145K while a colleague hired 6 months after you, with the same title and fewer responsibilities, makes $190K. Your manager doesn't know you know. Reviews are in 2 weeks.",
            "candidate_role": "Senior Data Scientist",
            "industry": "Technology",
            "stakes": "Your financial future. Your sense of worth. The relationship with your manager. Whether you stay or leave."
        },
        "agents": [
            {
                "agent_id": "david-chen",
                "name": "David Chen",
                "role": "Director of Data Science",
                "relationship_to_candidate": "manager",
                "archetype": "standard",
                "persona": "Your manager for 2 years. Generally supportive but avoids conflict. Didn't set your salary - inherited you from a reorg. Will be uncomfortable but is fundamentally fair. Needs to be pushed but will advocate for you if convinced. Hates surprises.",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=DavidChen&backgroundColor=b6e3f4"
            },
            {
                "agent_id": "hr-partner",
                "name": "Rachel Torres",
                "role": "HR Business Partner",
                "relationship_to_candidate": "hr",
                "archetype": "standard",
                "persona": "The HR partner for your org. Professional and process-oriented. Can be an ally if you approach correctly. Has seen salary inequities before. Will want to follow proper channels but genuinely cares about fairness.",
                "avatar_url": "https://api.dicebear.com/7.x/personas/svg?seed=RachelTorres&backgroundColor=c0aede"
            }
        ],
        "tasks": [
            {
                "task_id": "convo-david",
                "title": "Have the conversation with David",
                "description": "Raise the pay gap using STATE method",
                "urgency": "high",
                "completion_type": "message"
            },
            {
                "task_id": "decide-hr",
                "title": "Decide whether to involve HR",
                "description": "Consider escalating to Rachel if needed",
                "urgency": "medium",
                "completion_type": "message"
            }
        ],
        "inbox": [
            {
                "thread_id": "david-thread",
                "from_agent_id": "david-chen",
                "subject": "1:1 tomorrow",
                "preview": "Quick sync before reviews",
                "is_urgent": False,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-1",
                        "sender": "agent",
                        "agent_id": "david-chen",
                        "content": "Hey! Looking forward to our 1:1 tomorrow. Wanted to do a quick check-in before review season kicks off. Anything specific you want to discuss?",
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
                    "description": "Start with observable, undeniable facts - not conclusions or accusations.",
                    "example": "I recently learned that there's a significant gap between my compensation and others in the same role..."
                },
                {
                    "letter": "T",
                    "name": "Tell your story",
                    "description": "Explain what conclusion you're drawing, tentatively.",
                    "example": "I'm trying to understand what might explain this difference, and I'm struggling to see it..."
                },
                {
                    "letter": "A",
                    "name": "Ask for their path",
                    "description": "Genuinely invite their perspective. They may have context you don't.",
                    "example": "Can you help me understand how compensation decisions are made here?"
                },
                {
                    "letter": "T",
                    "name": "Talk tentatively",
                    "description": "Use language that keeps dialogue open, not defensive.",
                    "example": "I might be missing something, but..." or "Help me understand..."
                },
                {
                    "letter": "E",
                    "name": "Encourage testing",
                    "description": "Make it safe for them to share, even if it's uncomfortable.",
                    "example": "I want to have an honest conversation about this, even if it's awkward."
                }
            ],
            "pro_tip": "You can be assertive AND curious. The goal isn't to attack - it's to be treated fairly."
        },
        "coaching_prompts": {
            "accusatory": "That came across as an accusation. Start with facts and curiosity, not blame.",
            "too_passive": "You're being too tentative. This is your livelihood. You can be direct and respectful.",
            "threatening": "Ultimatums rarely work. Focus on understanding first, then solutions.",
            "good_state": "Strong use of STATE - you shared facts, invited dialogue, and stayed professional."
        }
    },

    # =========================================================================
    # PRIORITIZATION - The Launch Crisis (uses Eisenhower Matrix)
    # =========================================================================
    {
        "slug": "prioritization",
        "title": "The Launch Crisis",
        "skill_category": "prioritization",
        "description": "48 hours to launch. Critical bug discovered. Legal flagged a compliance issue. Your biggest customer wants a demo. What do you tackle first?",
        "learning_objectives": [
            "The Eisenhower Matrix (Urgent vs Important)",
            "Making decisions with incomplete information",
            "Communicating trade-offs to stakeholders",
            "Delegating effectively under pressure",
            "Managing up when things go wrong"
        ],
        "duration_minutes": 15,
        "difficulty": "intermediate",
        "availability": "both",
        "company_context": {
            "company_name": "Quantum Health",
            "company_description": "A healthtech startup that's raised $50M. Your product helps hospitals manage patient data. HIPAA compliance is non-negotiable. You've announced the launch date publicly.",
            "scenario_tension": "It's Wednesday morning. Launch is Friday. QA just found a bug that causes data loss in 0.1% of cases. Legal says there's a consent flow that might not be HIPAA compliant. And your $2M prospect wants a live demo Thursday to make their board meeting. Your CEO is asking for a status update in 2 hours.",
            "candidate_role": "VP of Product",
            "industry": "Healthcare Technology",
            "stakes": "Ship a buggy product and you could harm patients. Delay and you lose credibility and possibly the prospect. Get the legal wrong and you face fines and lawsuits."
        },
        "agents": [
            {
                "agent_id": "cto",
                "name": "Marcus Webb",
                "role": "CTO",
                "relationship_to_candidate": "peer",
                "archetype": "standard",
                "persona": "Your technical counterpart. Pragmatic engineer who's been through launches before. Will give you honest assessments. Protective of his team but will push if needed. Respects decisiveness.",
                "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=MarcusWebb&backgroundColor=b6e3f4"
            },
            {
                "agent_id": "ceo",
                "name": "Amanda Liu",
                "role": "CEO",
                "relationship_to_candidate": "manager",
                "archetype": "standard",
                "persona": "Founder-CEO who's bet everything on this launch. Under pressure from the board. Needs to know the real situation but hates surprises more than bad news. Will support tough calls if you make a clear case.",
                "avatar_url": "https://api.dicebear.com/7.x/personas/svg?seed=AmandaLiu&backgroundColor=c0aede"
            },
            {
                "agent_id": "legal",
                "name": "Jennifer Park",
                "role": "General Counsel",
                "relationship_to_candidate": "peer",
                "archetype": "standard",
                "persona": "Cautious by nature but understands business realities. Has seen companies destroyed by compliance failures. Needs to protect the company but will find solutions if pushed. Respects people who take legal seriously.",
                "avatar_url": "https://api.dicebear.com/7.x/lorelei/svg?seed=JenniferPark&backgroundColor=d1d4f9"
            },
            {
                "agent_id": "sales",
                "name": "Derek Okafor",
                "role": "VP of Sales",
                "relationship_to_candidate": "peer",
                "archetype": "difficult",
                "persona": "Has been working this prospect for 8 months. Commission and quota on the line. Will push hard for the demo but can be reasoned with if you help him find alternatives. Not great at hearing 'no' but respects honesty.",
                "avatar_url": "https://api.dicebear.com/7.x/adventurer/svg?seed=DerekOkafor&backgroundColor=ffdfbf"
            }
        ],
        "tasks": [
            {
                "task_id": "assess-bug",
                "title": "Assess the bug severity with Marcus",
                "description": "Understand the real risk and fix timeline",
                "urgency": "high",
                "completion_type": "message"
            },
            {
                "task_id": "legal-compliance",
                "title": "Address the compliance issue with Jennifer",
                "description": "Understand if this is a blocker or a fix",
                "urgency": "high",
                "completion_type": "message"
            },
            {
                "task_id": "manage-demo",
                "title": "Handle the demo request from Derek",
                "description": "Find a path forward that doesn't derail the launch",
                "urgency": "medium",
                "completion_type": "message"
            },
            {
                "task_id": "update-ceo",
                "title": "Update Amanda on the situation",
                "description": "Give her the real picture and your recommendation",
                "urgency": "high",
                "completion_type": "message"
            }
        ],
        "inbox": [
            {
                "thread_id": "marcus-thread",
                "from_agent_id": "cto",
                "subject": "Critical bug - need to talk",
                "preview": "QA found something",
                "is_urgent": True,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-1",
                        "sender": "agent",
                        "agent_id": "cto",
                        "content": "Just got out of QA review. We found a race condition that causes data loss in about 0.1% of sync operations. In healthcare, that's patient records. I think we can fix it in 36 hours with an all-hands push, but it's going to be tight. What do you want to do?",
                        "timestamp": 1711000000000
                    }
                ]
            },
            {
                "thread_id": "legal-thread",
                "from_agent_id": "legal",
                "subject": "HIPAA concern - consent flow",
                "preview": "Need to discuss before launch",
                "is_urgent": True,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-2",
                        "sender": "agent",
                        "agent_id": "legal",
                        "content": "I've been reviewing the final build and I'm concerned about the consent flow on mobile. Users can technically proceed without explicitly acknowledging the data sharing terms. This could be a HIPAA issue. We should talk before launch.",
                        "timestamp": 1711000100000
                    }
                ]
            },
            {
                "thread_id": "derek-thread",
                "from_agent_id": "sales",
                "subject": "Demo for Memorial Health - THURSDAY",
                "preview": "This is the big one",
                "is_urgent": True,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-3",
                        "sender": "agent",
                        "agent_id": "sales",
                        "content": "Memorial Health wants a live demo Thursday afternoon for their board. This is a $2M annual deal and they're ready to sign if the demo goes well. I know launch is Friday but this is the deal that makes our quarter. Can we make this happen?",
                        "timestamp": 1711000200000
                    }
                ]
            },
            {
                "thread_id": "amanda-thread",
                "from_agent_id": "ceo",
                "subject": "Launch status?",
                "preview": "Board is asking",
                "is_urgent": False,
                "is_unread": True,
                "messages": [
                    {
                        "id": "msg-4",
                        "sender": "agent",
                        "agent_id": "ceo",
                        "content": "Hey - board is asking for a launch confidence update. I told them we're on track. Are we? Let's sync in 2 hours.",
                        "timestamp": 1711000300000
                    }
                ]
            }
        ],
        "framework_name": "Eisenhower Matrix",
        "framework_reference": {
            "title": "Eisenhower Decision Matrix",
            "steps": [
                {
                    "letter": "1",
                    "name": "Urgent + Important",
                    "description": "Do these NOW. Real crises with real consequences.",
                    "example": "Data loss bug (patient safety), HIPAA compliance (legal risk)"
                },
                {
                    "letter": "2",
                    "name": "Important + Not Urgent",
                    "description": "SCHEDULE these. They matter but can wait.",
                    "example": "Long-term product roadmap, team development"
                },
                {
                    "letter": "3",
                    "name": "Urgent + Not Important",
                    "description": "DELEGATE or deprioritize. Someone else's emergency.",
                    "example": "Demo request (important to sales, but not a launch blocker)"
                },
                {
                    "letter": "4",
                    "name": "Not Urgent + Not Important",
                    "description": "ELIMINATE. Don't let these distract you.",
                    "example": "Nice-to-have features, low-priority requests"
                }
            ],
            "pro_tip": "In a crisis, ruthlessly prioritize. You can't do everything, so do the right things."
        },
        "coaching_prompts": {
            "trying_to_please_everyone": "You can't fix everything at once. What's the actual highest priority?",
            "ignoring_legal": "Compliance isn't optional in healthcare. This could sink the company.",
            "caving_to_sales": "Derek's deal is important but not more important than patient safety.",
            "good_triage": "Good prioritization - you focused on the real blockers and managed expectations.",
            "honest_with_ceo": "Good - you told Amanda the truth. She can't help if she doesn't know."
        }
    }
]


async def seed_training_templates(conn):
    """Seed training templates - updates existing and adds new ones."""
    for template in TRAINING_TEMPLATES:
        # Check if template exists (use template_id since id might not exist in older schemas)
        existing = await conn.fetchrow(
            "SELECT template_id FROM training_templates WHERE slug = $1",
            template["slug"]
        )

        if existing:
            # Update existing template
            await conn.execute("""
                UPDATE training_templates SET
                    title = $2,
                    skill_category = $3,
                    description = $4,
                    learning_objectives = $5,
                    duration_minutes = $6,
                    difficulty = $7,
                    availability = $8,
                    company_context = $9,
                    agents = $10,
                    tasks = $11,
                    inbox = $12,
                    framework_name = $13,
                    framework_reference = $14,
                    coaching_prompts = $15
                WHERE slug = $1
            """,
                template["slug"],
                template["title"],
                template["skill_category"],
                template["description"],
                json.dumps(template["learning_objectives"]),
                template["duration_minutes"],
                template["difficulty"],
                template.get("availability", "both"),
                json.dumps(template["company_context"]),
                json.dumps(template["agents"]),
                json.dumps(template["tasks"]),
                json.dumps(template["inbox"]),
                template["framework_name"],
                json.dumps(template["framework_reference"]),
                json.dumps(template["coaching_prompts"])
            )
            print(f"Updated training template: {template['title']}")
        else:
            # Insert new template
            await conn.execute("""
                INSERT INTO training_templates (
                    slug, title, skill_category, description, learning_objectives,
                    duration_minutes, difficulty, availability, company_context,
                    agents, tasks, inbox, framework_name, framework_reference,
                    coaching_prompts
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            """,
                template["slug"],
                template["title"],
                template["skill_category"],
                template["description"],
                json.dumps(template["learning_objectives"]),
                template["duration_minutes"],
                template["difficulty"],
                template.get("availability", "both"),
                json.dumps(template["company_context"]),
                json.dumps(template["agents"]),
                json.dumps(template["tasks"]),
                json.dumps(template["inbox"]),
                template["framework_name"],
                json.dumps(template["framework_reference"]),
                json.dumps(template["coaching_prompts"])
            )
            print(f"Seeded training template: {template['title']}")
