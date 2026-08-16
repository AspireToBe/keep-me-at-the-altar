'use client'

import { useEffect, useState } from 'react'

interface JournalEntry {
  field_key: string
  content: string
  day_number?: number
  entry_type?: string
}

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

const PRAYER_SLOTS = [
  { key: 'prayer_9am',  label: '9am — Morning',     prompt: 'Surrender and consecration' },
  { key: 'prayer_12pm', label: '12pm — Midday',     prompt: 'Listening and stillness' },
  { key: 'prayer_3pm',  label: '3pm — Afternoon',   prompt: 'Intercession' },
  { key: 'prayer_6pm',  label: '6pm — Evening',     prompt: 'Alignment and declaration' },
]

const MONTHLY_FIELDS = [
  { key: 'prayer_focus', label: 'My Prayer Focus This Month' },
  { key: 'revelations',  label: 'Dreams / Revelations Received' },
  { key: 'hs_teaching',  label: 'What the Holy Spirit Is Teaching Me' },
  { key: 'scriptures',   label: 'Scriptures That Stood Out' },
]

const REFLECTION_FIELDS = [
  { key: 'what_changed',  label: 'What changed this month?' },
  { key: 'god_said',      label: 'The clearest thing God said:' },
  { key: 'answered',      label: 'A prayer He answered:' },
  { key: 'trusting',      label: 'Something still in progress — I am trusting Him for:' },
  { key: 'carry_forward', label: 'What I carry forward into next month:' },
]

// Suggested fasting days per month with critical dates
const SUGGESTED_DAYS: Record<string, { title: string; date?: string; fastType: string; ref: string; prayer: string; teaching: string; prompts: string[] }[]> = {
  January: [
    { title: 'Opening the Gate', date: 'January 1', fastType: 'Daniel Fast', ref: 'Isaiah 22:22', prayer: 'Lord, I open this year to You. What You open, no man can shut.', teaching: 'The key of the house of David — what God opens, no one can shut. As you begin this year, you are standing at a spiritual gate. What you bring to God now becomes the foundation of everything that follows. Open your hands. Open your year.', prompts: ['What do you want God to open for you this year?', 'What gates have felt closed? Lay them before God now.'] },
    { title: 'Consecration', fastType: 'Daniel Fast', ref: 'Romans 12:1', prayer: 'I present my body, my plans, and my year as a living sacrifice.', teaching: 'Consecration is not about being perfect — it is about being surrendered. Your body, your schedule, your ambitions — all of it laid on the altar. Not destroyed, but offered. And what God receives, He transforms.', prompts: ['What area of your life needs to be fully surrendered this year?', 'What are you holding back from God — and why?'] },
    { title: 'Hearing His Voice', fastType: 'Daniel Fast', ref: 'John 10:27', prayer: 'Speak, Lord. Quiet every other voice so I can hear You clearly.', teaching: 'Fasting is one of the most powerful ways to turn down the volume of everything else — appetite, noise, distraction — so that the still small voice becomes audible again. What has God been trying to say that the noise has drowned out?', prompts: ['What has God been trying to say to you that you have not stopped to hear?', 'What distractions have been drowning Him out? Name them and release them.'] },
    { title: 'Breaking Old Patterns', fastType: 'Daniel Fast', ref: 'Isaiah 43:18-19', prayer: 'God, I release the old. I receive the new thing You are doing.', teaching: 'Old patterns, old mindsets, old wounds — they do not belong in this new season. The new thing God is doing requires new wineskins. What needs to die in you so the new thing can live?', prompts: ['What old pattern or mindset needs to die in this new year?', 'What does the new thing look like in your specific life?'] },
    { title: 'Sealing the Fast', date: 'January 7', fastType: 'Daniel Fast', ref: 'Psalm 5:3', prayer: 'I lay my petitions before You and wait in expectation.', teaching: 'David prayed in the morning and then watched expectantly. Now you seal it. You write your declarations. You do not beg — you present, and you wait with expectation, not anxiety. God has heard. Now watch.', prompts: ['What are your top 3 prayer declarations for this year?', 'Write them as faith declarations — what you are believing God for.'] },
  ],
  February: [
    { title: 'Loving God First', fastType: 'Intermittent Fast', ref: 'Matthew 22:37', prayer: 'Lord, recalibrate my love. Let my first love be You above all else.', teaching: 'When love for God is first, everything else falls into its right place. When it slips, everything drifts. February asks: where has your love drifted? Not to shame you — to call you back.', prompts: ['How has your love for God grown or cooled in the past season?', 'What would loving God with your whole heart look like practically this week?'] },
    { title: 'Loving Yourself Well', fastType: 'Intermittent Fast', ref: 'Psalm 139:14', prayer: 'I receive Your love for me. I am fearfully and wonderfully made.', teaching: 'He did not make a mistake when He made you. The works of His hands are wonderful. That includes you — your body, your mind, your story. Receive it.', prompts: ['Where do you struggle most to love yourself?', 'Write 5 things God says about you that you need to believe more deeply.'] },
    { title: 'Forgiving Deeply', fastType: 'Intermittent Fast', ref: 'Colossians 3:13', prayer: 'I choose to forgive as You have forgiven me.', teaching: 'Unforgiveness is a prison you build for someone else and then live in yourself. Full forgiveness looks like wishing them well and meaning it.', prompts: ['Who do you need to forgive? Write their name and what happened.', 'What would full forgiveness look like — and what would it free you from?'] },
    { title: "Valentine's Day Fast", date: 'February 14', fastType: 'Media Fast', ref: 'Song of Solomon 2:4', prayer: 'His banner over me is love. I feast on Your presence today.', teaching: 'On a day the world dedicates to romantic love, you are choosing a different feast — the presence of the One who loved you first. Let this fast be a love offering back to God.', prompts: ['How has God shown His love to you this past year?', 'Write a love letter to God today.'] },
    { title: "Receiving God's Love", fastType: 'Intermittent Fast', ref: 'Romans 8:38-39', prayer: 'Nothing can separate me from Your love. I receive it fully today.', teaching: 'Nothing — not height or depth, life or death, angels or demons. You are not loved because you are good. You are loved because He is. This is not a reward you earn — it is a foundation you build on.', prompts: ['Do you truly believe God loves you unconditionally? What makes it hard to receive?', 'How would your life look different if you lived fully convinced of His love?'] },
  ],
  March: [
    { title: 'Ash Wednesday — Entering Lent', date: 'Ash Wednesday', fastType: 'Total Fast (24hrs)', ref: 'Joel 2:12', prayer: 'I return to You with my whole heart. Rend my heart, not just my garments.', teaching: 'Ash Wednesday marks the beginning of Lent — forty days of preparation and penitence. The ashes are a sign of mortality and repentance. What in you needs to return to God today?', prompts: ['What do you need to genuinely repent of this season?', 'Write a prayer of honest return to God — not performance, but reality.'] },
    { title: 'Entering the Desert', fastType: 'Partial Fast', ref: 'Matthew 4:1', prayer: 'Lord, I follow You into the wilderness. What You strip away, I release willingly.', teaching: 'The wilderness is not punishment; it is preparation. Every great move of God in Scripture was preceded by a desert season. The desert strips everything unnecessary and leaves only what is real.', prompts: ['What comfort or distraction is God asking you to lay down this Lent?', 'What does your personal desert look like right now?'] },
    { title: 'Facing Temptation', fastType: 'Partial Fast', ref: '1 Corinthians 10:13', prayer: 'You always provide a way out. Open my eyes to see it and my will to take it.', teaching: 'Jesus overcame temptation not by willpower but by the Word. Every temptation was met with "it is written." You have the same weapon. Fasting sharpens your ability to see the way out.', prompts: ['What is your greatest area of temptation right now?', 'What practical boundary will you set this Lent to protect yourself?'] },
    { title: 'Silence & Solitude', fastType: 'Media Fast', ref: 'Psalm 46:10', prayer: 'Be still. Stop striving. You are God and I am not.', teaching: '"Be still" in Hebrew means to let go, to release, to stop trying to control. Stillness is not passive — it is an active act of trust. When was the last time you sat in complete silence before God with no agenda?', prompts: ['When did you last sit in complete silence before God without an agenda?', 'What does He say to you when the noise finally stops?'] },
    { title: 'The Cross', fastType: 'Partial Fast', ref: 'Galatians 2:20', prayer: 'I am crucified with Christ. The life I now live, I live by faith in the Son of God.', teaching: 'The cross is not a metaphor. You are crucified with Christ — the old self has died. And the life you now live is not your own. Lent asks: what in you still needs to be crucified?', prompts: ['What in you needs to be crucified this season?', 'What does dying to self look like in your specific daily life?'] },
  ],
  April: [
    { title: 'Palm Sunday', date: 'Palm Sunday', fastType: 'Partial Fast', ref: 'John 12:13', prayer: 'Lord, I lay down my agenda. I welcome You as King — not as I imagined You, but as You truly are.', teaching: 'The crowd welcomed Jesus expecting a political deliverer. They got a suffering servant. When God does not come the way we expected, we have two choices: adjust our expectations or miss Him entirely.', prompts: ['Where have your expectations of God disappointed you?', 'What does it mean to truly crown Him King — not the King you want, but the King He is?'] },
    { title: 'Good Friday — The Fast of the Cross', date: 'Good Friday', fastType: 'Total Fast (24hrs)', ref: 'Isaiah 53:5', prayer: 'By Your wounds I am healed. I stand at the cross and receive everything You purchased for me.', teaching: 'By His stripes we are healed. Not will be — are. It is a completed act. Today is the day to stand at the foot of the cross and receive — not to work for it or deserve it, but to open your hands and receive the gift that cost Him everything.', prompts: ['What has the cross purchased for you that you have not yet fully received?', 'Spend time in silence at the foot of the cross. What do you hear Him say?'] },
    { title: 'Holy Saturday — Waiting in the Dark', date: 'Holy Saturday', fastType: 'Partial Fast', ref: 'Psalm 30:5', prayer: 'Weeping may endure for a night, but joy comes in the morning. I trust You in the silence.', teaching: 'Holy Saturday is the in-between day. Jesus is in the tomb. There are seasons in your life that feel like this — something has died, and the resurrection has not come yet. This is not abandonment. It is the space before dawn.', prompts: ['What situation in your life feels like Holy Saturday — uncertain, silent, waiting?', 'How do you hold faith in the in-between? What does trust look like right now?'] },
    { title: 'Resurrection Sunday', date: 'Easter Sunday', fastType: 'Gratitude Fast', ref: 'Romans 6:4', prayer: 'I walk in newness of life. What was dead is alive. What was buried is risen.', teaching: 'Resurrection Sunday changes everything. Not just historically — personally. Because Christ rose, you walk in newness of life. What dead thing are you believing God to resurrect?', prompts: ['What resurrection are you believing God for in your life right now?', 'What area of your life needs to come back to life — and what would that look like?'] },
    { title: 'Post-Resurrection — Walking It Out', fastType: 'Partial Fast', ref: 'Luke 24:32', prayer: 'Set my heart on fire as You walk with me and open the scriptures to me.', teaching: 'The disciples on the road to Emmaus said: did not our hearts burn within us as He talked with us? The resurrection is not just an event to celebrate — it is a power to walk in every day.', prompts: ['How will you carry the resurrection power of Easter into the rest of the year?', 'What changes in your daily life because of what Christ has done?'] },
  ],
  May: [
    { title: 'Waiting for the Promise', fastType: 'Corporate Fast', ref: 'Acts 1:4', prayer: 'Lord, I wait for what You have promised. I will not move until You move.', teaching: 'Jesus told the disciples to wait in Jerusalem. Waiting is not inaction — it is the most active form of obedience when God says wait. The disciples waited ten days. What they received was worth every moment.', prompts: ['What promise of God are you still waiting for?', 'What does active, obedient waiting look like for you right now?'] },
    { title: 'Hunger for the Holy Spirit', fastType: 'Partial Fast', ref: 'Luke 11:13', prayer: 'Father, fill me afresh with Your Holy Spirit. I ask — fill me afresh.', teaching: 'The Holy Spirit is not something you earn or deserve — He is a gift from the Father to those hungry enough to ask. The promise is staggering in its simplicity: ask.', prompts: ['When did you last experience a genuine fresh filling of the Holy Spirit?', 'What does being full of the Spirit look like in your daily ordinary life?'] },
    { title: 'Pentecost Sunday', date: 'Pentecost Sunday', fastType: 'Corporate Fast', ref: 'Acts 2:1-4', prayer: 'Send Your fire, Lord. Fill this house again.', teaching: 'Fifty days after Easter, the Holy Spirit fell suddenly on those gathered in one accord. Pentecost required unity. The fire fell on a unified body. Division quenches the Spirit; unity invites Him.', prompts: ['Where is there division in your relationships or community right now?', 'What is your specific role in building unity? What does that cost you?'] },
    { title: 'Tongues of Fire — Speaking Boldly', fastType: 'Media Fast', ref: 'Acts 2:4', prayer: 'Set my tongue on fire with Your truth. Give me boldness to speak what You have placed in me.', teaching: 'The fire did not just warm them — it gave them utterance. What has God placed in you that needs to be spoken? What word, what testimony, what declaration have you been holding back?', prompts: ['What has God given you to say that you have been holding back?', 'Who specifically needs to hear what God has placed in you?'] },
    { title: 'Signs, Wonders & the Harvest', fastType: 'Partial Fast', ref: 'Acts 2:43', prayer: 'Let signs and wonders follow the preaching of Your word. Use me as a vessel of Your power.', teaching: 'After Pentecost, signs and wonders accompanied the proclamation of the gospel. You are not asking for something extraordinary; you are asking for what the New Testament presents as ordinary. Believe for it.', prompts: ['What specific miracle are you believing God for right now?', 'Who in your sphere of influence needs a demonstration of God\'s power?'] },
  ],
  June: [
    { title: 'The Harvest is Plentiful', fastType: 'Partial Fast', ref: 'Matthew 9:37-38', prayer: 'Lord of the harvest, send out labourers. Begin with me — send me.', teaching: 'Jesus looked at the crowds and felt compassion. Then He spoke about the harvest. The connection is not accidental: evangelism flows from compassion, and compassion flows from seeing people the way Jesus sees them.', prompts: ['Who in your life is ready to hear the gospel right now?', 'What is genuinely stopping you from sharing it with them?'] },
    { title: 'Compassion for the Lost', fastType: 'Partial Fast', ref: 'Luke 15:20', prayer: 'Give me Your heart for the lost — the same compassion that made the Father run.', teaching: 'The father saw his son while he was still a long way off and ran. That is the heart of God toward the lost. Not waiting for them to get it together. Running.', prompts: ['When did you last feel genuine compassion for someone far from God?', 'How can you cultivate the Father\'s heart for the lost this month?'] },
    { title: 'Your Personal Mission Field', fastType: 'Partial Fast', ref: 'Acts 1:8', prayer: 'Use me in Jerusalem first — my home, my street, my workplace. Start close.', teaching: 'Jerusalem was home. Most people start looking for mission fields across the ocean when there are people right next door who have never heard the gospel clearly presented. Your mission field is closer than you think.', prompts: ['Who are the 5 people closest to you who need Jesus?', 'Write their names. Commit to pray for them every day this month.'] },
    { title: 'Sowing in Tears', fastType: 'Partial Fast', ref: 'Psalm 126:5-6', prayer: 'I go out weeping, carrying the seed. I trust You for the harvest.', teaching: 'Those who sow in tears will reap in joy. Some seeds are sown with great sacrifice — prayers offered year after year for someone who shows no response. Keep sowing. The tears are part of the seed.', prompts: ['What seeds have you been sowing in prayer or service for the lost?', 'Where do you need to keep sowing even when you see no fruit yet?'] },
    { title: 'Generosity as Witness', fastType: 'Generosity Fast', ref: 'Matthew 5:16', prayer: 'Let my good works shine so brightly that people ask about the God behind them.', teaching: 'When your generosity is unexplained by self-interest, when your kindness exceeds what circumstances require, when your peace does not make sense in the storm — people ask questions. Those questions are open doors.', prompts: ['How can your generosity this month become a testimony that opens spiritual doors?', 'What specific act of kindness can create a genuine spiritual conversation?'] },
  ],
  July: [
    { title: 'Halftime Review', date: 'July 1', fastType: 'Daniel Fast', ref: 'Lamentations 3:40', prayer: 'Lord, let me examine my ways honestly. Show me where I have drifted.', teaching: 'Let us examine our ways and test them, and let us return to the Lord. Not a quick glance — a thorough, honest assessment. Where are you in relation to what you believed God said in January?', prompts: ['What were your goals and declarations for this year? Review them honestly.', 'Where have you drifted from God\'s plan? What led to the drift?'] },
    { title: 'Gratitude for the First Half', fastType: 'Daniel Fast', ref: 'Psalm 103:2', prayer: 'I bless You, Lord, and I will not forget all Your benefits in these past 6 months.', teaching: 'Before you assess what went wrong, count what went right. God has been faithful in the first half even when you were not. There are answered prayers, moments of grace, breakthroughs you almost missed.', prompts: ['List 10 specific things God has done for you in the first half of this year.', 'What almost went unnoticed that you need to pause and thank Him for?'] },
    { title: 'Releasing What Didn\'t Work', fastType: 'Daniel Fast', ref: 'Philippians 3:13', prayer: 'I forget what is behind and strain toward what is ahead.', teaching: 'Forgetting what is behind is not pretending it did not happen — it is choosing not to let it determine your future. What you release, God redeems. What you hold onto, weighs you down.', prompts: ['What disappointment or failure from the first half do you need to release?', 'What would it feel like to truly let it go and move forward free?'] },
    { title: 'Recommitting to Purpose', fastType: 'Daniel Fast', ref: 'Habakkuk 2:2-3', prayer: 'The vision is for an appointed time. I recommit to what You have called me to.', teaching: 'The vision has a timing — it will not prove false. But you must recommit to it. Half a year of drift does not cancel a God-given assignment. It just means you need to find your way back.', prompts: ['What is your specific God-given assignment for this year?', 'What concrete step will you take in the second half that you have been avoiding?'] },
    { title: 'Sealing the Midpoint', date: 'July 7', fastType: 'Daniel Fast', ref: 'Joshua 1:9', prayer: 'Be strong and courageous. You are with me wherever I go.', teaching: 'Be strong and courageous. Not because the second half will be easy, but because God is with you. You are not going alone. You never were. Write your declaration for the second half of this year.', prompts: ['What fear or hesitation has held you back in the first half?', 'Write a declaration of faith and courage for August through December.'] },
  ],
  August: [
    { title: 'The Gift of Silence', fastType: 'Social Media Fast', ref: 'Psalm 62:1', prayer: 'My soul finds rest in You alone. I quiet every voice that is not Yours.', teaching: 'Silence is not empty — it is full of God. But you cannot experience that until you actually stop and enter it. If silence feels uncomfortable, that discomfort is information worth examining.', prompts: ['What does silence feel like for you right now — peaceful or deeply uncomfortable?', 'What does your discomfort with silence reveal about where you find your worth?'] },
    { title: 'Sabbath Rest', fastType: 'Striving Fast', ref: 'Matthew 11:28-29', prayer: 'I come to You, weary and burdened. I take Your yoke — easy and light.', teaching: 'Jesus does not say "get it together and then come." He says come as you are, bring everything you are carrying, and I will give you rest. What are you carrying that God never asked you to carry?', prompts: ['What burdens are you carrying that God never assigned to you?', 'What would true rest look like for you this month — practically and spiritually?'] },
    { title: 'Detoxing the Mind', fastType: 'Media Fast', ref: 'Philippians 4:8', prayer: 'I choose to think on what is true, noble, right, pure, lovely, and admirable.', teaching: 'Your mind becomes what it consistently consumes. A month of reduced media and digital noise is a month of mental detox. You may be surprised what you hear when you stop filling every moment with noise.', prompts: ['What content have you been consuming that has shaped your thinking negatively?', 'What will you intentionally replace it with this month?'] },
    { title: 'Hearing in the Stillness', fastType: 'Media Fast', ref: '1 Kings 19:12', prayer: 'Speak in the still small voice. I am listening. I have turned off the noise to hear You.', teaching: 'God was not in the wind, or the earthquake, or the fire. After the fire — a still small voice. The most important things God says often come in the quietest moments.', prompts: ['What has God been trying to say to you that the noise has been drowning out?', 'What do you hear when you actually stop and sit in the quiet right now?'] },
    { title: 'Renewal of Strength', fastType: 'Intermittent Fast', ref: 'Isaiah 40:31', prayer: 'I wait on You, Lord. Renew my strength. Let me mount up with wings like eagles.', teaching: 'Those who wait on the Lord will renew their strength. The renewal comes in the waiting, not after it. Where are you most depleted? That is where God wants to meet you first.', prompts: ['Where are you most spiritually, emotionally, and physically depleted right now?', 'What does genuine renewal look like for you in this specific season?'] },
  ],
  September: [
    { title: 'The Fear of the Lord', fastType: 'Intermittent Fast', ref: 'Proverbs 9:10', prayer: 'Teach me to fear You rightly — not in terror, but in reverence.', teaching: 'The fear of the Lord is the beginning of wisdom. This fear is not cowering terror but profound reverence — the recognition that God is God and you are not. When that becomes your posture, every decision flows from a different source.', prompts: ['What does the fear of the Lord mean to you practically — in specific decisions?', 'Where have you been making decisions without genuinely consulting God?'] },
    { title: 'The Mind of Christ', fastType: 'Intermittent Fast', ref: '1 Corinthians 2:16', prayer: 'I have the mind of Christ. I ask You to activate it — to think Your thoughts after You.', teaching: 'We have the mind of Christ. This is not aspiration — it is declaration. But having access and using it are different. Ask for the mind of Christ to be activated in your specific situation today.', prompts: ['In what specific area of your life do you most need the mind of Christ?', 'What would Christ think about your most pressing current situation?'] },
    { title: 'Learning from the Holy Spirit', fastType: 'Intermittent Fast', ref: 'John 14:26', prayer: 'Holy Spirit, teach me all things. Be my Teacher today.', teaching: 'The best education available to you is not in any institution — it is in the quiet classroom of the Spirit. What is He currently teaching you? Not what have you studied — what has He specifically been highlighting?', prompts: ['What is the Holy Spirit currently teaching you in this season?', 'What lesson keeps coming up that you have not fully learned yet?'] },
    { title: 'Wisdom for Relationships', fastType: 'Partial Fast', ref: 'James 1:5', prayer: 'I lack wisdom — I ask You generously. Give me wisdom for every relationship.', teaching: 'God does not hold your lack of wisdom against you — He offers to give it generously. But you must ask. Which relationship in your life needs the most wisdom right now?', prompts: ['Which relationship in your life needs the most wisdom right now?', 'What would a genuinely wise response look like in that relationship?'] },
    { title: 'Applying What You Know', fastType: 'Partial Fast', ref: 'James 1:22', prayer: 'Make me a doer of the word, not just a hearer.', teaching: 'The greatest danger of Bible knowledge is that you can accumulate it without applying it. Head knowledge without obedience is self-deception. What truth have you known for a long time that you have not yet acted on?', prompts: ['What truth do you know but have not applied? Name it specifically.', 'What is the gap between your knowledge and your obedience right now?'] },
  ],
  October: [
    { title: 'Know Your Enemy', fastType: 'Normal Fast', ref: 'Ephesians 6:12', prayer: 'I wrestle not against flesh and blood. Open my eyes to the real battle behind what I see.', teaching: 'The person who hurt you is not your real enemy. The circumstance that is crushing you is not the real battle. Fasting sharpens your ability to see past the surface to what is actually happening.', prompts: ['Where in your life are you fighting the wrong enemy — a person instead of a spirit?', 'What is the real spiritual battle behind your most pressing current struggle?'] },
    { title: 'Put on the Full Armour', fastType: 'Normal Fast', ref: 'Ephesians 6:13-17', prayer: 'I put on the full armour of God today — truth, righteousness, peace, faith, salvation, and the Word.', teaching: 'The armour of God is not automatic — you put it on. Every piece is a different dimension of your relationship with God. Which piece are you neglecting?', prompts: ['Which piece of the armour do you most neglect — and what does that cost you?', 'What would it look like to intentionally put on each piece of armour today?'] },
    { title: 'The Power of the Name', fastType: 'Normal Fast', ref: 'Philippians 2:10', prayer: 'At the name of Jesus, every knee bows. I speak that name over every situation that has not yet bowed.', teaching: 'At the name of Jesus, every knee shall bow — in heaven, on earth, under the earth. There is no situation, no stronghold, no circumstance that is outside the authority of that name.', prompts: ['What situation in your life needs to bow to the name of Jesus right now?', 'Speak it out loud and write your declaration of authority over it.'] },
    { title: 'Interceding for Your City', fastType: 'Normal Fast', ref: 'Jeremiah 29:7', prayer: 'I seek the peace and prosperity of this city. I pray for my city today.', teaching: 'Your wellbeing is connected to the wellbeing of your city. You are not a tourist passing through — you are a planter, a pray-er, a presence. October is the strategic month to target your city in intercession.', prompts: ['What are the specific spiritual needs of your city right now?', 'What targeted, specific prayer will you pray for your community this month?'] },
    { title: 'Standing Firm', fastType: 'Normal Fast', ref: 'Ephesians 6:13', prayer: 'Having done all, I stand. I will not retreat. I will not be moved.', teaching: 'Sometimes the warfare assignment is not to advance but to hold ground. There is a moment when you have prayed, fasted, declared, and done everything you know to do — and the word is simply: stand.', prompts: ['Where have you been most tempted to give up in prayer or in standing firm?', 'What would it look like to stand firm until the breakthrough comes?'] },
  ],
  November: [
    { title: 'Counting Your Blessings', date: 'November 1', fastType: 'Gratitude Fast', ref: 'Psalm 103:1-2', prayer: 'I bless You, Lord, with everything in me. I will not forget a single thing You have done.', teaching: 'Forgetting the goodness of God is not just ingratitude — it is spiritually dangerous. It leads to anxiety, complaint, and the false belief that you are on your own. Count the benefits. List them. Speak them out.', prompts: ['List 20 specific blessings from this year — be specific, not vague.', 'What almost went unnoticed? What has God done that you nearly forgot?'] },
    { title: 'The Fast of Contentment', fastType: 'Gratitude Fast', ref: 'Philippians 4:11-12', prayer: 'I have learned contentment in all states. Teach me to be content — not complacent, but at peace.', teaching: 'Contentment is not a personality trait — it is a discipline. Paul learned it through seasons of abundance and want. Contentment is not giving up on your dreams; it is refusing to let their absence steal your peace.', prompts: ['Where are you most discontent right now? Name it honestly.', 'What would contentment look like without giving up on your God-given dreams?'] },
    { title: 'Generosity as Worship', fastType: 'Generosity Fast', ref: '2 Corinthians 9:7', prayer: 'I give cheerfully — not under compulsion. My giving is an act of worship, not obligation.', teaching: 'God loves a cheerful giver. Giving should feel like freedom, not burden. When giving feels like obligation, something has gone wrong in your theology. Generosity is a response to grace.', prompts: ['What can you give away this month — money, time, skill, encouragement?', 'Who is God specifically putting on your heart to bless this month?'] },
    { title: 'Thanksgiving Day Fast', date: 'Thanksgiving Day', fastType: 'Gratitude Fast', ref: '1 Thessalonians 5:18', prayer: 'In everything I give thanks — not for everything, but in everything. Even here, You are God.', teaching: 'Give thanks in all circumstances — not for all circumstances. You do not have to thank God for the pain. But you can thank Him in the midst of it — because He is still God, still present, still faithful.', prompts: ['What difficult situation can you find something genuine to be grateful for?', 'What has suffering taught you in this season that comfort never could?'] },
    { title: 'Finishing Well', date: 'November 30', fastType: 'Partial Fast', ref: '2 Timothy 4:7', prayer: 'I want to finish well. Help me end this year having fought the good fight.', teaching: 'Paul wrote this from prison, facing execution. His measure of success was not comfort or achievement but faithfulness. As the year draws toward its close, the question is not: did I succeed? but: did I stay faithful?', prompts: ['As the year draws to a close, what do you still want to finish?', 'What unfinished business — spiritual, relational, practical — needs your attention?'] },
  ],
  December: [
    { title: 'Advent Sunday 1 — The Candle of Hope', date: 'Advent Sunday 1', fastType: 'Advent Partial Fast', ref: 'Romans 15:13', prayer: 'God of hope, fill me with all joy and peace as I trust in You. Let hope overflow.', teaching: 'Hope is not wishful thinking — it is confident expectation rooted in the character of God. The God of hope has not changed. His record of faithfulness in your life has not changed.', prompts: ['What are you genuinely hoping for as you close this year?', 'Where has hope grown dim — and what would it take to relight it?'] },
    { title: 'Advent Sunday 2 — The Candle of Peace', date: 'Advent Sunday 2', fastType: 'Advent Partial Fast', ref: 'Isaiah 9:6', prayer: 'Prince of Peace, rule in my heart. Let Your peace govern every area of my life still in turmoil.', teaching: 'Peace is a person — Jesus Himself who calms every storm He enters. Where is there turmoil in your life right now? He walks into that space and speaks: Peace, be still.', prompts: ['Where do you most need peace right now — be specific?', 'What would surrendering that specific area to the Prince of Peace look like?'] },
    { title: 'Advent Sunday 3 — The Candle of Joy', date: 'Advent Sunday 3', fastType: 'Advent Partial Fast', ref: 'Nehemiah 8:10', prayer: 'The joy of the Lord is my strength. Restore the joy of Your salvation in me.', teaching: 'Happiness depends on circumstances; joy depends on God. It is possible to be in the middle of the hardest season of your life and still have the deep, settled, unshakeable joy of the Lord.', prompts: ['When did you last experience deep, unshakeable joy — not happiness, but joy?', 'What stole your joy this year, and how do you reclaim it?'] },
    { title: 'Advent Sunday 4 — The Candle of Love', date: 'Advent Sunday 4', fastType: 'Advent Partial Fast', ref: 'John 3:16', prayer: 'You so loved the world that You gave. I receive that love again today — as if for the first time.', teaching: 'The measure of God\'s love is not words — it is the giving of His Son. As you close this year, receive that love again — fresh, unearned, overwhelming, and personal.', prompts: ['How has God\'s love shown up for you this year in unexpected ways?', 'Write a love letter back to God as you close the year.'] },
    { title: 'December 31 — Closing the Year', date: 'December 31', fastType: 'Total Fast (until midnight)', ref: 'Psalm 90:12', prayer: 'Teach me to number my days, that I may gain a heart of wisdom.', teaching: 'Time is a gift and a stewardship. Every day you did not choose to be alive — God chose it for you. As this year ends, count the days. Count the grace. Do not drift into a new year. Close this one with worship.', prompts: ['Review your journal from this year — what did God say most consistently?', 'What are you declaring over the year ahead? Write it as a faith declaration.'] },
  ],
}

export default function JournalPage() {
  const [email, setEmail] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [currentMonth, setCurrentMonth] = useState('January')
  const [view, setView] = useState<'monthly'|'altar'|'reflection'|'fasting'|'summary'|'yearreview'>('monthly')
  const [fastingDay, setFastingDay] = useState(0)
  const [altarWeek, setAltarWeek] = useState(1)
  const [saveStatus, setSaveStatus] = useState('')
  const [sending, setSending] = useState(false)
  const [yearReviewData, setYearReviewData] = useState<Record<string, JournalEntry[]>>({})
  const [yearReviewLoading, setYearReviewLoading] = useState(false)
  const [userDays, setUserDays] = useState<{title:string;date:string}[]>([])
  const [addingDay, setAddingDay] = useState(false)
  const [newDayTitle, setNewDayTitle] = useState('')
  const [newDayDate, setNewDayDate] = useState('')
  const [newDayFastType, setNewDayFastType] = useState('')

  const gold = '#A67C2E'; const ink = '#1E1B16'; const muted = '#5A5347'
  const bg = '#F7F4EF'; const surface = '#EDE9E1'; const border = '#CEC8BC'

  useEffect(() => {
    // Check for Supabase magic link token in URL
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1))
      const accessToken = params.get('access_token')
      if (accessToken) {
        // Decode the JWT to get the email
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]))
          const userEmail = payload.email
          if (userEmail) {
            localStorage.setItem('kmata_email', userEmail)
            setEmail(userEmail)
            setLoggedIn(true)
            // Clean up the URL
            window.history.replaceState({}, document.title, '/journal')
            return
          }
        } catch (e) {
          console.error('Token parse error:', e)
        }
      }
    }
    // Fall back to saved email in localStorage
    const saved = localStorage.getItem('kmata_email')
    if (saved) { setEmail(saved); setLoggedIn(true) }
  }, [])

  useEffect(() => {
    if (loggedIn && email) {
      fetch(`/api/journal?email=${encodeURIComponent(email)}&month=${currentMonth}`)
        .then(r => r.json())
        .then(data => Array.isArray(data) && setEntries(data))
      // Load user-added days from localStorage
      const saved = localStorage.getItem(`kmata_userdays_${currentMonth}`)
      if (saved) setUserDays(JSON.parse(saved))
      else setUserDays([])
    }
  }, [loggedIn, email, currentMonth])

  function getEntry(key: string) {
    return entries.find(e => e.field_key === key)?.content || ''
  }

  function saveEntry(field_key: string, content: string, dayNum = 0, entryType = view) {
    setSaveStatus('Saving...')
    fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, month: currentMonth, day_number: dayNum, entry_type: entryType, field_key, content })
    })
    .then(r => r.json())
    .then(() => {
      setSaveStatus('Saved ✓')
      setTimeout(() => setSaveStatus(''), 2500)
      setEntries(prev => {
        const exists = prev.find(e => e.field_key === field_key)
        if (exists) return prev.map(e => e.field_key === field_key ? {...e, content} : e)
        return [...prev, { field_key, content }]
      })
    })
    .catch(() => setSaveStatus('Error saving'))
  }

  async function loadYearReview() {
    if (!email) return
    setYearReviewLoading(true)
    const results: Record<string, JournalEntry[]> = {}
    for (const month of MONTHS) {
      const res = await fetch(`/api/journal?email=${encodeURIComponent(email)}&month=${month}`)
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) results[month] = data
    }
    setYearReviewData(results)
    setYearReviewLoading(false)
  }

  function addUserDay() {
    if (!newDayTitle) return
    const updated = [...userDays, { title: newDayTitle, date: newDayDate, fastType: newDayFastType || 'Personal fast' }]
    setUserDays(updated)
    localStorage.setItem(`kmata_userdays_${currentMonth}`, JSON.stringify(updated))
    setNewDayTitle(''); setNewDayDate(''); setNewDayFastType(''); setAddingDay(false)
    setFastingDay(SUGGESTED_DAYS[currentMonth].length + updated.length - 1)
  }

  function sendLink() {
    setSending(true)
    localStorage.setItem('kmata_email', email)
    fetch('/api/auth/magic-link', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email }) })
      .then(() => { setSending(false); alert('Check your email — your journal link has been sent!') })
      .catch(() => { setSending(false); alert('Something went wrong. Please try again.') })
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', padding:'12px', borderRadius:'8px', border:`1px solid ${border}`,
    background: surface, fontSize:'15px', color: ink, resize:'vertical',
    fontFamily:'Georgia,serif', boxSizing:'border-box', lineHeight:'1.6'
  }
  const labelStyle: React.CSSProperties = {
    display:'block', color: gold, fontSize:'11px', letterSpacing:'0.1em',
    textTransform:'uppercase', marginBottom:'6px', fontFamily:'sans-serif', fontWeight:500
  }
  const navBtn = (active: boolean): React.CSSProperties => ({
    padding:'7px 14px', borderRadius:'20px', border:`1px solid ${active ? gold : border}`,
    background: active ? gold : 'transparent', color: active ? 'white' : muted,
    cursor:'pointer', fontSize:'12px', fontFamily:'sans-serif', whiteSpace:'nowrap'
  })
  const pillBtn = (active: boolean): React.CSSProperties => ({
    padding:'5px 12px', borderRadius:'20px', border:`1px solid ${active ? gold : border}`,
    background: active ? gold : 'transparent', color: active ? 'white' : muted,
    cursor:'pointer', fontSize:'12px', fontFamily:'sans-serif'
  })

  const prayerSection = (prefix: string, dayNum: number, entryType: string) => (
    <div style={{ marginTop:'2rem', padding:'1.25rem', background:'white', borderRadius:'10px', border:`1px solid ${border}` }}>
      <p style={{ color: gold, fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'sans-serif', fontWeight:500, marginBottom:'1.25rem' }}>Prayer Time Appointments</p>
      {PRAYER_SLOTS.map(slot => (
        <div key={`${prefix}_${slot.key}`} style={{ marginBottom:'1.25rem' }}>
          <label style={labelStyle}>{slot.label}</label>
          <p style={{ color: muted, fontSize:'12px', marginBottom:'6px', fontStyle:'italic' }}>{slot.prompt}</p>
          <textarea rows={3} defaultValue={getEntry(`${prefix}_${slot.key}`)}
            onBlur={e => saveEntry(`${prefix}_${slot.key}`, e.target.value, dayNum, entryType)}
            style={inputStyle} placeholder="Write your prayer here..." />
        </div>
      ))}
    </div>
  )

  if (!loggedIn) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background: bg, fontFamily:'Georgia,serif' }}>
        <div style={{ textAlign:'center', padding:'2rem', maxWidth:'400px' }}>
          <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>🕯</div>
          <h1 style={{ color: gold, fontSize:'1.4rem', marginBottom:'0.5rem' }}>Keep Me At The Altar™</h1>
          <p style={{ color: muted, marginBottom:'1.5rem', fontSize:'14px', lineHeight:'1.6' }}>Enter your email to access your personal journal.</p>
          <input type="email" placeholder="Your email address" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key==='Enter' && email && sendLink()}
            style={{ ...inputStyle, marginBottom:'1rem', textAlign:'center' }} />
          <button onClick={sendLink} disabled={sending||!email}
            style={{ background:gold, color:'white', border:'none', padding:'12px 28px', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontFamily:'sans-serif', width:'100%', opacity:(!email||sending)?0.6:1 }}>
            {sending ? 'Sending...' : 'Send my journal link'}
          </button>
          <p style={{ color: border, fontSize:'12px', marginTop:'1rem' }}>No password needed. Link expires in 24 hours.</p>
        </div>
      </div>
    )
  }

  const suggestedDays = SUGGESTED_DAYS[currentMonth] || []
  const allDays = [...suggestedDays, ...userDays.map((d, i) => ({
    ...d, ref: 'Personal fast', fastType: 'Your chosen fast',
    prayer: 'Lord, I come before You today in fasting and prayer.',
    teaching: 'This is a personal fasting day you added. Use this space to write what God is speaking to you today.',
    prompts: ['What is God highlighting to you today?', 'Write your prayer and declaration for this day.']
  }))]

  return (
    <div style={{ minHeight:'100vh', background: bg, fontFamily:'Georgia,serif' }}>

      {/* Header */}
      <div style={{ background: ink, padding:'0.85rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10 }}>
        <h1 style={{ color: gold, margin:0, fontSize:'0.9rem', fontFamily:'sans-serif', letterSpacing:'0.08em' }}>KEEP ME AT THE ALTAR™</h1>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          {saveStatus && <span style={{ color: saveStatus.includes('✓') ? '#6BCB77' : '#FFD166', fontSize:'11px', fontFamily:'sans-serif' }}>{saveStatus}</span>}
          <button onClick={() => { localStorage.removeItem('kmata_email'); setLoggedIn(false); setEmail('') }}
            style={{ background:'transparent', border:`1px solid ${muted}`, color:muted, padding:'3px 10px', borderRadius:'4px', cursor:'pointer', fontSize:'11px', fontFamily:'sans-serif' }}>
            Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* Month selector + back */}
        <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          <select value={currentMonth} onChange={e => { setCurrentMonth(e.target.value); setView('monthly'); setFastingDay(0); setAltarWeek(1) }}
            style={{ padding:'8px 14px', borderRadius:'8px', border:`1px solid ${border}`, background:'white', fontSize:'14px', color:ink, fontFamily:'sans-serif' }}>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span style={{ color:muted, fontSize:'13px', fontFamily:'sans-serif' }}>
            {MONTHS.indexOf(currentMonth)+1} of 12
          </span>
          <div style={{ marginLeft:'auto', display:'flex', gap:'6px' }}>
            <button onClick={() => { const i=MONTHS.indexOf(currentMonth); if(i>0){setCurrentMonth(MONTHS[i-1]); setView('monthly')} }}
              disabled={currentMonth==='January'}
              style={{ ...pillBtn(false), opacity:currentMonth==='January'?0.4:1 }}>← Prev</button>
            <button onClick={() => { const i=MONTHS.indexOf(currentMonth); if(i<11){setCurrentMonth(MONTHS[i+1]); setView('monthly')} }}
              disabled={currentMonth==='December'}
              style={{ ...pillBtn(false), opacity:currentMonth==='December'?0.4:1 }}>Next →</button>
          </div>
          <a href="/" style={{ color:gold, fontSize:'13px', fontFamily:'sans-serif', textDecoration:'none' }}>← Platform</a>
        </div>

        {/* View tabs */}
        <div style={{ display:'flex', gap:'6px', marginBottom:'2rem', flexWrap:'wrap' }}>
          {[
            {id:'monthly', label:'Monthly'},
            {id:'fasting', label:'Fasting Days'},
            {id:'altar', label:'Altar Day'},
            {id:'reflection', label:'Reflection'},
            {id:'summary', label:'Summary'},
            {id:'yearreview', label:'Year in Review'},
          ].map(tab => (
            <button key={tab.id} style={navBtn(view===tab.id)} onClick={() => {
              setView(tab.id as typeof view)
              if (tab.id === 'yearreview') loadYearReview()
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* MONTHLY VIEW */}
        {view==='monthly' && (
          <div>
            <h2 style={{ color:ink, fontSize:'1.6rem', marginBottom:'0.25rem' }}>{currentMonth}</h2>
            <p style={{ color:muted, fontSize:'13px', marginBottom:'2rem', fontFamily:'sans-serif' }}>Your monthly journal space. Entries save automatically.</p>
            {MONTHLY_FIELDS.map(f => (
              <div key={f.key} style={{ marginBottom:'1.5rem' }}>
                <label style={labelStyle}>{f.label}</label>
                <textarea rows={4} defaultValue={getEntry(f.key)}
                  onBlur={e => saveEntry(f.key, e.target.value)}
                  style={inputStyle} placeholder="Write here..." />
              </div>
            ))}
          </div>
        )}

        {/* FASTING DAYS VIEW */}
        {view==='fasting' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <h2 style={{ color:ink, fontSize:'1.6rem', margin:0 }}>{currentMonth} — Fasting Days</h2>
              <button onClick={() => setAddingDay(true)}
                style={{ background:gold, color:'white', border:'none', padding:'6px 14px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontFamily:'sans-serif' }}>
                + Add a day
              </button>
            </div>

            {/* Add day form */}
            {addingDay && (
              <div style={{ background:'white', border:`1px solid ${gold}`, borderRadius:'10px', padding:'1.25rem', marginBottom:'1.5rem' }}>
                <p style={{ color:gold, fontSize:'12px', fontFamily:'sans-serif', fontWeight:500, marginBottom:'0.75rem' }}>Add a personal fasting day</p>
                <input placeholder="Title (e.g. Special fast for breakthrough)"
                  value={newDayTitle} onChange={e => setNewDayTitle(e.target.value)}
                  style={{ ...inputStyle, marginBottom:'0.75rem', resize:'none' }} />
                <input type="date" value={newDayDate} onChange={e => setNewDayDate(e.target.value)}
                  style={{ ...inputStyle, marginBottom:'0.75rem', resize:'none' }} />
                <select value={newDayFastType} onChange={e => setNewDayFastType(e.target.value)}
                  style={{ ...inputStyle, marginBottom:'0.75rem', resize:'none' }}>
                  <option value="">Select fast type...</option>
                  <option value="Total Fast (24hrs)">Total Fast (24hrs) — No food or water</option>
                  <option value="Normal Fast">Normal Fast — No food, water only</option>
                  <option value="Daniel Fast">Daniel Fast — No meat, dairy or sweets</option>
                  <option value="Partial Fast">Partial Fast — Skip one or two meals</option>
                  <option value="Intermittent Fast">Intermittent Fast — Fast until a set time</option>
                  <option value="Media Fast">Media Fast — No social media or entertainment</option>
                  <option value="Generosity Fast">Generosity Fast — Give something away each day</option>
                  <option value="Corporate Fast">Corporate Fast — Fasting with others</option>
                </select>
                <div style={{ display:'flex', gap:'8px' }}>
                  <button onClick={addUserDay} style={{ background:gold, color:'white', border:'none', padding:'8px 16px', borderRadius:'6px', cursor:'pointer', fontSize:'13px', fontFamily:'sans-serif' }}>Add</button>
                  <button onClick={() => setAddingDay(false)} style={{ background:'transparent', border:`1px solid ${border}`, color:muted, padding:'8px 16px', borderRadius:'6px', cursor:'pointer', fontSize:'13px', fontFamily:'sans-serif' }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Day selector */}
            <div style={{ display:'flex', gap:'6px', marginBottom:'1.5rem', flexWrap:'wrap' }}>
              {allDays.map((d, i) => (
                <button key={i} onClick={() => setFastingDay(i)}
                  style={{ ...pillBtn(fastingDay===i), position:'relative' }}>
                  {d.date ? d.date : `Day ${i+1}`}
                  {i >= suggestedDays.length && <span style={{ marginLeft:'4px', fontSize:'10px' }}>✦</span>}
                </button>
              ))}
            </div>

            {allDays[fastingDay] && (() => {
              const day = allDays[fastingDay]
              const prefix = `fd${fastingDay}`
              const isUserDay = fastingDay >= suggestedDays.length
              return (
                <div>
                  {/* Day header */}
                  <div style={{ background:'white', borderRadius:'10px', padding:'1.25rem', marginBottom:'1.5rem', border:`1px solid ${border}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <p style={{ color:gold, fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'sans-serif', marginBottom:'4px' }}>
                          {currentMonth}{day.date ? ` · ${day.date}` : ` · Fasting Day ${fastingDay+1}`}
                        </p>
                        <h3 style={{ color:ink, fontSize:'1.2rem', margin:'0 0 4px' }}>{day.title}</h3>
                        <p style={{ color:muted, fontSize:'12px', margin:0, fontFamily:'sans-serif' }}>Scripture: {day.ref}</p>
                      </div>
                      <span style={{ background:`${gold}22`, color:gold, padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontFamily:'sans-serif', whiteSpace:'nowrap' }}>
                        {day.fastType}
                      </span>
                    </div>
                  </div>

                  {/* Appointment with God */}
                  <div style={{ background:'#EAE6DE', borderRadius:'10px', padding:'1.25rem', marginBottom:'1.5rem', borderLeft:`3px solid ${gold}` }}>
                    <p style={{ color:gold, fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'sans-serif', fontWeight:500, marginBottom:'8px' }}>Appointment with God</p>
                    <p style={{ color:ink, fontStyle:'italic', fontSize:'14px', margin:0, lineHeight:'1.6' }}>"{day.prayer}"</p>
                  </div>

                  {/* Teaching */}
                  {!isUserDay && (
                    <div style={{ background:'white', borderRadius:'10px', padding:'1.25rem', marginBottom:'1.5rem', border:`1px solid ${border}` }}>
                      <p style={{ color:gold, fontSize:'11px', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'sans-serif', fontWeight:500, marginBottom:'8px' }}>Reflection</p>
                      <p style={{ color:muted, fontSize:'14px', lineHeight:'1.7', margin:0 }}>{day.teaching}</p>
                    </div>
                  )}

                  {/* Fields */}
                  <div style={{ marginBottom:'1.5rem' }}>
                    <label style={labelStyle}>Today's Reflection</label>
                    <textarea rows={5} defaultValue={getEntry(`${prefix}_reflection`)}
                      onBlur={e => saveEntry(`${prefix}_reflection`, e.target.value, fastingDay, 'fasting')}
                      style={inputStyle} placeholder="Write freely — what is God saying to you today?" />
                  </div>
                  {day.prompts.map((prompt, pi) => (
                    <div key={pi} style={{ marginBottom:'1.5rem' }}>
                      <label style={labelStyle}>{pi+1}. {prompt}</label>
                      <textarea rows={4} defaultValue={getEntry(`${prefix}_q${pi+1}`)}
                        onBlur={e => saveEntry(`${prefix}_q${pi+1}`, e.target.value, fastingDay, 'fasting')}
                        style={inputStyle} placeholder="Write here..." />
                    </div>
                  ))}
                  {prayerSection(prefix, fastingDay, 'fasting')}
                </div>
              )
            })()}
          </div>
        )}

        {/* ALTAR DAY VIEW */}
        {view==='altar' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <h2 style={{ color:ink, fontSize:'1.6rem', margin:0 }}>{currentMonth} — Altar Day</h2>
              <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                <span style={{ color:muted, fontSize:'12px', fontFamily:'sans-serif' }}>Week:</span>
                {[1,2,3,4].map(w => (
                  <button key={w} onClick={() => setAltarWeek(w)} style={pillBtn(altarWeek===w)}>{w}</button>
                ))}
              </div>
            </div>
            <p style={{ color:muted, fontSize:'13px', marginBottom:'2rem', fontFamily:'sans-serif' }}>
              Week {altarWeek} — Your weekly reset. One day set apart to fast, listen, and align.
            </p>
            {prayerSection(`altar_w${altarWeek}`, altarWeek, 'altar')}
            <div style={{ marginBottom:'1.5rem', marginTop:'1.5rem' }}>
              <label style={labelStyle}>One Word God Gave Me Today</label>
              <textarea rows={2}
                defaultValue={getEntry(`altar_w${altarWeek}_word`)}
                onBlur={e => saveEntry(`altar_w${altarWeek}_word`, e.target.value, altarWeek, 'altar')}
                style={inputStyle} placeholder="Write here..." />
            </div>
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={labelStyle}>How I feel leaving the altar today</label>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {['Peaceful','Convicted','Renewed','Expectant','Surrendered','On Fire'].map(f => (
                  <button key={f} onClick={() => saveEntry(`altar_w${altarWeek}_feeling`, f, altarWeek, 'altar')}
                    style={pillBtn(getEntry(`altar_w${altarWeek}_feeling`)===f)}>{f}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* REFLECTION VIEW */}
        {view==='reflection' && (
          <div>
            <h2 style={{ color:ink, fontSize:'1.6rem', marginBottom:'0.25rem' }}>{currentMonth} — End of Month</h2>
            <p style={{ color:muted, fontSize:'13px', marginBottom:'2rem', fontFamily:'sans-serif' }}>What did God do this month? What do you carry forward?</p>
            {REFLECTION_FIELDS.map(f => (
              <div key={f.key} style={{ marginBottom:'1.5rem' }}>
                <label style={labelStyle}>{f.label}</label>
                <textarea rows={4} defaultValue={getEntry(f.key)}
                  onBlur={e => saveEntry(f.key, e.target.value)}
                  style={inputStyle} placeholder="Write here..." />
              </div>
            ))}
            <div style={{ marginBottom:'1.5rem' }}>
              <label style={labelStyle}>My spiritual temperature this month</label>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {['Cold','Warming','Steady','Hot','On Fire'].map(t => (
                  <button key={t} onClick={() => saveEntry('temperature', t)}
                    style={pillBtn(getEntry('temperature')===t)}>{t}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* YEAR IN REVIEW */}
        {view==='yearreview' && (
          <div>
            <h2 style={{ color:ink, fontSize:'1.6rem', marginBottom:'0.25rem' }}>Year in Review</h2>
            <p style={{ color:muted, fontSize:'13px', marginBottom:'2rem', fontFamily:'sans-serif' }}>
              Everything you wrote across all 12 months — your complete record of the year.
            </p>

            {yearReviewLoading && (
              <div style={{ textAlign:'center', padding:'3rem', color:muted, fontFamily:'sans-serif' }}>
                <p>Loading your year...</p>
              </div>
            )}

            {!yearReviewLoading && Object.keys(yearReviewData).length === 0 && (
              <div style={{ textAlign:'center', padding:'3rem', color:muted, fontFamily:'sans-serif' }}>
                <p>No entries found yet.</p>
                <p style={{ fontSize:'13px' }}>Start journalling in any month and it will appear here.</p>
              </div>
            )}

            {!yearReviewLoading && MONTHS.map(month => {
              const monthEntries = yearReviewData[month]
              if (!monthEntries || monthEntries.length === 0) return null

              const getMonthEntry = (key: string) => monthEntries.find(e => e.field_key === key)?.content || ''

              const prayerFocus = getMonthEntry('prayer_focus')
              const godSaid = getMonthEntry('god_said')
              const whatChanged = getMonthEntry('what_changed')
              const carryForward = getMonthEntry('carry_forward')
              const temp = getMonthEntry('temperature')

              return (
                <div key={month} style={{ marginBottom:'2rem', borderRadius:'12px', border:`1px solid ${border}`, overflow:'hidden' }}>
                  {/* Month header */}
                  <div style={{ background: ink, padding:'1rem 1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <h3 style={{ color: gold, margin:0, fontSize:'1.1rem', fontFamily:'sans-serif' }}>{month}</h3>
                    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                      {temp && <span style={{ background:`${gold}33`, color: gold, padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontFamily:'sans-serif' }}>{temp}</span>}
                      <span style={{ color:muted, fontSize:'11px', fontFamily:'sans-serif' }}>{monthEntries.length} entries</span>
                    </div>
                  </div>

                  <div style={{ padding:'1.25rem' }}>
                    {prayerFocus && (
                      <div style={{ marginBottom:'1rem' }}>
                        <p style={{ color:gold, fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'sans-serif', marginBottom:'4px' }}>Prayer Focus</p>
                        <p style={{ color:ink, fontSize:'14px', lineHeight:'1.6', margin:0, whiteSpace:'pre-wrap' }}>{prayerFocus}</p>
                      </div>
                    )}
                    {whatChanged && (
                      <div style={{ marginBottom:'1rem' }}>
                        <p style={{ color:gold, fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'sans-serif', marginBottom:'4px' }}>What Changed</p>
                        <p style={{ color:ink, fontSize:'14px', lineHeight:'1.6', margin:0, whiteSpace:'pre-wrap' }}>{whatChanged}</p>
                      </div>
                    )}
                    {godSaid && (
                      <div style={{ marginBottom:'1rem', padding:'0.85rem 1rem', background:'#EAE6DE', borderRadius:'8px', borderLeft:`3px solid ${gold}` }}>
                        <p style={{ color:gold, fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'sans-serif', marginBottom:'4px' }}>The Clearest Thing God Said</p>
                        <p style={{ color:ink, fontSize:'14px', lineHeight:'1.6', margin:0, fontStyle:'italic', whiteSpace:'pre-wrap' }}>{godSaid}</p>
                      </div>
                    )}
                    {carryForward && (
                      <div>
                        <p style={{ color:gold, fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'sans-serif', marginBottom:'4px' }}>Carried Forward</p>
                        <p style={{ color:muted, fontSize:'13px', lineHeight:'1.6', margin:0, whiteSpace:'pre-wrap' }}>{carryForward}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* SUMMARY VIEW */}
        {view==='summary' && (
          <div>
            <h2 style={{ color:ink, fontSize:'1.6rem', marginBottom:'0.25rem' }}>{currentMonth} — Summary</h2>
            <p style={{ color:muted, fontSize:'13px', marginBottom:'2rem', fontFamily:'sans-serif' }}>A read-only review of everything you wrote this month.</p>

            {/* Monthly entries */}
            {MONTHLY_FIELDS.map(f => getEntry(f.key) && (
              <div key={f.key} style={{ marginBottom:'1.25rem', padding:'1rem', background:'white', borderRadius:'8px', border:`1px solid ${border}` }}>
                <p style={{ color:gold, fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'sans-serif', marginBottom:'6px' }}>{f.label}</p>
                <p style={{ color:ink, fontSize:'14px', lineHeight:'1.7', margin:0, whiteSpace:'pre-wrap' }}>{getEntry(f.key)}</p>
              </div>
            ))}

            {/* Fasting day entries */}
            {allDays.map((day, i) => {
              const prefix = `fd${i}`
              const ref = getEntry(`${prefix}_reflection`)
              const q1 = getEntry(`${prefix}_q1`)
              const q2 = getEntry(`${prefix}_q2`)
              if (!ref && !q1 && !q2) return null
              return (
                <div key={i} style={{ marginBottom:'1.25rem', padding:'1rem', background:'white', borderRadius:'8px', border:`1px solid ${border}` }}>
                  <p style={{ color:gold, fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'sans-serif', marginBottom:'8px' }}>
                    {day.date || `Fasting Day ${i+1}`} — {day.title}
                  </p>
                  {ref && <p style={{ color:ink, fontSize:'14px', lineHeight:'1.7', marginBottom:'8px', whiteSpace:'pre-wrap' }}>{ref}</p>}
                  {q1 && <p style={{ color:muted, fontSize:'13px', lineHeight:'1.6', marginBottom:'4px', whiteSpace:'pre-wrap' }}><em>{day.prompts[0]}</em><br/>{q1}</p>}
                  {q2 && <p style={{ color:muted, fontSize:'13px', lineHeight:'1.6', whiteSpace:'pre-wrap' }}><em>{day.prompts[1]}</em><br/>{q2}</p>}
                </div>
              )
            })}

            {/* Altar day entries */}
            {[1,2,3,4].map(w => {
              const morning = getEntry(`altar_w${w}_morning`)
              const midday = getEntry(`altar_w${w}_midday`)
              const evening = getEntry(`altar_w${w}_evening`)
              if (!morning && !midday && !evening) return null
              return (
                <div key={w} style={{ marginBottom:'1.25rem', padding:'1rem', background:'white', borderRadius:'8px', border:`1px solid ${border}` }}>
                  <p style={{ color:gold, fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'sans-serif', marginBottom:'8px' }}>Altar Day — Week {w}</p>
                  {morning && <p style={{ color:ink, fontSize:'14px', lineHeight:'1.7', marginBottom:'6px', whiteSpace:'pre-wrap' }}><strong>Morning:</strong> {morning}</p>}
                  {midday && <p style={{ color:ink, fontSize:'14px', lineHeight:'1.7', marginBottom:'6px', whiteSpace:'pre-wrap' }}><strong>Midday:</strong> {midday}</p>}
                  {evening && <p style={{ color:ink, fontSize:'14px', lineHeight:'1.7', whiteSpace:'pre-wrap' }}><strong>Evening:</strong> {evening}</p>}
                </div>
              )
            })}

            {/* Reflection entries */}
            {REFLECTION_FIELDS.map(f => getEntry(f.key) && (
              <div key={f.key} style={{ marginBottom:'1.25rem', padding:'1rem', background:'#EAE6DE', borderRadius:'8px', borderLeft:`3px solid ${gold}` }}>
                <p style={{ color:gold, fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'sans-serif', marginBottom:'6px' }}>{f.label}</p>
                <p style={{ color:ink, fontSize:'14px', lineHeight:'1.7', margin:0, whiteSpace:'pre-wrap' }}>{getEntry(f.key)}</p>
              </div>
            ))}

            {entries.length === 0 && (
              <div style={{ textAlign:'center', padding:'3rem', color:muted, fontFamily:'sans-serif' }}>
                <p>No entries yet for {currentMonth}.</p>
                <p style={{ fontSize:'13px' }}>Start with the Monthly tab or a Fasting Day.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
