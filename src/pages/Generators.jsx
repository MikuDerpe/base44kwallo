
import React, { useState, useEffect } from "react";
import { useProfile } from "@/components/common/ProfileProvider";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import GeneratorSelector from "../components/generators/GeneratorSelector";
import ContentGenerator from "../components/generators/ContentGenerator";

const sequenceGenerators = ["instagram_story", "email"];

// Niche-specific role context additions
const nicheRoleContexts = {
  "General Online Business": "You understand the fast-paced world of online business, from dropshipping and SMMA to crypto and side hustles. You know how to speak to ambitious entrepreneurs who want to scale quickly and maximize profits.",
  "Info Products": "You're an expert in the info products space, speaking to coaches, consultants, and digital product owners. You understand the psychology of selling knowledge and building authority.",
  "Startups & Tech": "You're fluent in startup and tech language, crafting content for app founders, SaaS companies, and innovation-driven businesses. You understand the unique challenges of building and scaling tech products.",
  "Fitness": "You understand the fitness world deeply, from gym culture and calisthenics to sports performance, yoga, and pilates. You know how to motivate and inspire people on their fitness journey.",
  "Mindset": "You're a master of mindset content, drawing from inspiration, esoteric wisdom, manifestation principles, and mindset reprogramming techniques. You know how to inspire transformation and shift perspectives.",
  "Health & Wellness": "You're deeply knowledgeable about health optimization, nutrition science, longevity practices, and biohacking. You speak to health-conscious individuals who want to optimize their wellbeing.",
  "Lifestyle & Personal Brand": "You understand the lifestyle and personal brand space, from travel and luxury content to day-in-the-life vlogs and content-first creators. You know how to build authentic personal brands that resonate."
};

// Softened role contexts to avoid triggering formal writing
const roleContexts = {
  social_post: "You are a social media content creator who knows how to craft viral, high-converting posts. You speak directly to your audience in their language, combining attention-grabbing hooks with persuasive storytelling that drives action.",
  email: "You are an email marketing expert who writes compelling email sequences that convert. You understand email psychology and know how to write subject lines that get opened and body copy that drives clicks and sales.",
  instagram_story: "You are an Instagram Stories creator who makes engaging, interactive content that stops the scroll and drives massive engagement. You understand the unique format of Stories and how to use them to build authentic connections.",
  ad_copy: "You are an advertising copywriter who specializes in high-converting ad scripts. You know how to grab attention, build desire, overcome objections, and drive action in both short-form and long-form formats.",
  sales_page: "You are a sales page copywriter who understands the psychology of persuasion. You craft compelling long-form sales copy that addresses objections, builds trust, and converts cold traffic into paying customers.",
  youtube_script: "You are a YouTube content creator who makes engaging, value-packed video scripts that keep viewers watching and drive them to take action. You understand pacing, storytelling, and how to structure content for maximum retention and conversion."
};

export default function GeneratorsPage() {
  const { activeProfile, isLoading: isProfileLoading, canGenerate, incrementGenerations, userTier, generationsUsed } = useProfile();
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    if (typeParam) {
      setSelectedType(typeParam);
    }
  }, []);

  const handleGenerate = async (generatorConfig, formState) => {
    if (!canGenerate()) {
      alert("You've reached your generation limit. Please upgrade your plan to continue.");
      return null;
    }

    // Track content generation
    if (window.fbq) {
      window.fbq('trackCustom', 'ContentGenerated', {
        content_type: selectedType,
        generator_name: generatorConfig.title
      });
    }

    // Special handling for YouTube scripts - use multi-part generation
    if (selectedType === 'youtube_script') {
      try {
        const effectiveNiche = formState.selected_niche || activeProfile.niche;

        // Fetch knowledge items, differentiating between full scripts and hooks
        const [allGuidelines, allFullScriptExamples, allHookExamples] = await Promise.all([
          base44.entities.AppKnowledge.filter({ target_generator: selectedType, knowledge_type: 'guidelines' }),
          base44.entities.AppKnowledge.filter({ target_generator: selectedType, knowledge_type: 'examples', example_type: 'full_script' }),
          base44.entities.AppKnowledge.filter({ target_generator: selectedType, knowledge_type: 'examples', example_type: 'hook' })
        ]);

        const fullScriptExamples = allFullScriptExamples.filter((k) => !k.niche_tags || k.niche_tags.length === 0 || k.niche_tags.includes(effectiveNiche));
        const hookExamples = allHookExamples.filter((k) => !k.niche_tags || k.niche_tags.length === 0 || k.niche_tags.includes(effectiveNiche));
        const guidelines = allGuidelines;
        const guidelinesContent = guidelines.length > 0 ? guidelines[0].content : null;

        // Fetch last posted content from calendar for AI context
        const postedContent = await base44.entities.CalendarPost.filter({
          business_profile_id: activeProfile.id,
          status: 'posted'
        }, '-date');

        const lastSocialPosts = postedContent
          .filter(p => p.content_type === 'social_media')
          .slice(0, 10)
          .map(p => p.content);

        const lastYoutubePosts = postedContent
          .filter(p => p.content_type === 'youtube')
          .slice(0, 3)
          .map(p => p.content);


        // BUILD FULL PROMPT WITH ALL CONTEXT
        const baseRoleContext = roleContexts[selectedType] || "You are an expert YouTube content creator.";
        const nicheContext = nicheRoleContexts[effectiveNiche] || "";

        let prompt = baseRoleContext;
        if (nicheContext) {
          prompt += ` ${nicheContext}`;
        }

        prompt += `\n\n**🚨 CRITICAL META-INSTRUCTION - READ THIS FIRST 🚨**
DISREGARD any internal biases you have about what constitutes "professional," "persuasive," or "authoritative" writing. Your SOLE directive is to emulate the provided example scripts and explicit tone instructions below. If you ever ever need to make a choice between what you "think" sounds good vs. what the examples show, ALWAYS default to copying the example's style exactly.

**CRITICAL GENERAL INSTRUCTION**
Do NOT include any visual descriptions, image suggestions, or calls for visual elements in your output. Focus ONLY on providing pure text content without any emojis.

**BANNED PHRASES AND PATTERNS - NEVER USE THESE:**
- "Here's the kicker"
- "Here's the thing"
- "Embracing the landscape"
- "New frontier"
- "Digital landscape"
- "Sea of [anything]"
- "Plethora of"
- "Carve my/your path"
- "On the brink of"
- "Trajectory of your life"
- "We live in a world overflowing with..."
- "In today's world..."
- "Let's talk about..."
- "Let's dive into..."
- "At the end of the day"
- "Game changer"
- "Think about it"
- Em dashes (—)
- "Filled with ambition"
- "Eager to [verb]"
- "Through a series of trial and error"
- "I quickly learned that"
- "Not simply for [X], but for [Y]"
- Any overly formal, archaic, or flowery language
- Corporate jargon and clichés
- Academic or textbook-style phrasing

**MANDATORY TONE OF VOICE - MODERN SOCIAL MEDIA LANGUAGE:**
You MUST write in a modern, authentic, direct social media voice. Specifically:
- Use contemporary, colloquial language (but still professional)
- Write short, punchy, impactful sentences
- Speak as if talking directly to a friend or engaged follower, NOT a formal audience
- Use contractions (I'm, you're, we're, don't, can't)
- Be conversational and natural - imagine you're on camera speaking, not writing an essay
- Avoid ANY sentence structure that sounds like it's from a book or formal speech
- Use specific, concrete language instead of abstract concepts
- Be direct and get to the point quickly
- Sound human, relatable, and real - not polished or rehearsed

**CRITICAL ANTI-GENERICITY INSTRUCTIONS (AVOID AT ALL COSTS):**
Your goal is to create *unique, valuable, and highly engaging* content. Absolutely AVOID the following traits that lead to generic, low-quality AI output:
- **Generic Death:** Do not use boring, recycled openings or common advice. Provide *fresh perspectives* and *unique insights/frameworks*.
- **Repetition Disease:** Do not repeat the same message across multiple sections without progression or new information. Each section MUST build on the last.
- **Credibility Vacuum:** Your content MUST convey results, proof, authority, and demonstrated expertise. Avoid pure theory without practical grounding.
- **Value Wasteland:** Do not deliver platitudes or vague advice like "find your passion" or "be consistent." Provide *actionable steps, specific strategies, and concrete value*.
- **Engagement Killer:** Incorporate hooks, pattern interrupts, curiosity gaps, and strong reasons for viewers to keep watching. Your script MUST be compelling from start to finish.
- **Trust Destroyer:** Do not promise insights and deliver rehashed common knowledge. Ensure every piece of advice feels earned and specific to the business profile's expertise.
- **Algorithm Poison:** Create content that will naturally encourage high retention, shares, and platform promotion because of its *inherent quality and uniqueness*.

**Your content must feel personal, vulnerable where appropriate, and include specific systems or frameworks. It should deliver immediate value and integrate clear, effective calls-to-action seamlessly.**

**🎯 MANDATORY: CREATE UNIQUE FRAMEWORK/SYSTEM**
You MUST create or reference a specific, proprietary framework, system, or methodology. Examples:
- ❌ "Just be consistent and authentic"
- ✅ "The 3-Layer Authority System" or "Content Waterfall Method" or "Personal Media Company Framework"

Name it, explain its components, and make it feel like exclusive insider knowledge.

**💰 MANDATORY: INCLUDE SPECIFIC, CONCRETE RESULTS**
Always use SPECIFIC numbers and outcomes, never vague language:
- ❌ "Opened doors I never imagined" or "Changed everything"
- ✅ "Went from 0 to 50K followers in 8 months and landed my first $25K client"
- ✅ "Built a $13.8M business with a 2M person audience"
- ✅ "Generated 350K views on a single video using this exact method"

Use numbers from the business profile's Client Results wherever possible.

**🔥 MANDATORY: INCLUDE CONTRARIAN/UNIQUE ANGLE**
Take a strong, contrarian, or unique stance on something. Don't just agree with common wisdom:
- ❌ "Personal branding is important"
- ✅ "Everyone's teaching personal branding wrong. Here's why 'be authentic' is actually terrible advice"
- ✅ "The personal branding industry is lying to you about consistency"

**🚫 CRITICAL: PRODUCT MENTIONS = 5% MAX**
- Product/service mentions should be MAXIMUM 5% of total script
- NO dedicated sales sections
- Only soft, natural mentions like "I use a tool called [Product] to help with this"
- Focus 95% on VALUE DELIVERY, 5% on product
- If you create a product-focused section, you FAILED this instruction`;

        prompt += `\n\n**CONTEXT: BUSINESS PROFILE**
- Business Name: ${activeProfile.business_name}
- Business Type: ${activeProfile.business_type}
- Niche: ${activeProfile.niche}
- Offer Statement: ${activeProfile.offer_statement || 'Not provided'}
- Content Interests: ${activeProfile.content_interests || 'Not provided'}
- Target Audience: ${activeProfile.target_audience || 'Not provided'}
- Audience Pains: ${activeProfile.audience_pains || 'Not provided'}
- Business Story: ${activeProfile.business_story || 'Not provided'}
- Desired Outcome: ${activeProfile.desired_outcome || 'Not provided'}
- Customer Objections: ${activeProfile.customer_objections || 'Not provided'}
- Offer Structure: ${activeProfile.offer_structure || 'Not provided'}
- Unique Selling Proposition: ${activeProfile.usp || 'Not provided'}
- Client Results: ${activeProfile.client_results || 'Not provided'}
- Client Count: ${activeProfile.client_count || 'Not provided'}
- Tone of Voice / Existing Content: ${activeProfile.existing_content_scripts || 'Not provided'}

**🚨 ABSOLUTE TRUTH SOURCE 🚨**
The Business Profile above is the ONLY source of truth for facts, features, and claims. You MUST:
- ONLY use product/service details from the Business Profile
- NEVER invent features or capabilities not listed above
- NEVER copy features from example scripts - those are different businesses!
- If an example mentions features X, Y, Z but the Business Profile doesn't - IGNORE THEM COMPLETELY`;

        prompt += `\n\n**MANDATORY: USE THESE SPECIFIC DETAILS IN YOUR SCRIPT:**
- You MUST reference or adapt the Business Story when building credibility
- You MUST cite SPECIFIC numbers from Client Results as proof points (extract actual numbers, revenue, follower counts, time frames)
- You MUST address Audience Pains directly with solutions
- You MUST incorporate the USP as a unique angle or contrarian take
- You MUST match the Tone of Voice from existing content
- You MUST create or reference a unique framework/system based on the business's expertise`;

        // ADD POSTED CONTENT CONTEXT
        if (lastSocialPosts.length > 0 || lastYoutubePosts.length > 0) {
          prompt += `\n\n**CONTEXT: RECENTLY POSTED CONTENT**
This is content the user has recently posted and marked as published. Use this to understand their current messaging, topics, and style evolution:`;

          if (lastSocialPosts.length > 0) {
            prompt += `\n\n**Last ${lastSocialPosts.length} Social Media Posts:**\n`;
            lastSocialPosts.forEach((post, idx) => {
              prompt += `\nPost ${idx + 1}:\n${post.substring(0, 500)}${post.length > 500 ? '...' : ''}\n`;
            });
          }

          if (lastYoutubePosts.length > 0) {
            prompt += `\n\n**Last ${lastYoutubePosts.length} YouTube Scripts:**\n`;
            lastYoutubePosts.forEach((post, idx) => {
              prompt += `\nScript ${idx + 1}:\n${post.substring(0, 800)}${post.length > 800 ? '...' : ''}\n`;
            });
          }
        }


        if (guidelinesContent) {
          prompt += `\n\n**CRITICAL STRUCTURE INSTRUCTION**
You ABSOLUTELY MUST follow this structure strictly when creating the content. Deviations will result in unusable output:
${guidelinesContent}`;
        }

        // Handle hooks - either user-provided or from knowledge base
        if (formState.custom_hooks && formState.custom_hooks.trim()) {
          prompt += `\n\n**🪝 CRITICAL HOOK INSTRUCTION - USER PROVIDED HOOKS**
The user has provided specific hooks they want you to analyze and adapt. You MUST:
1. Read all provided hooks carefully
2. Analyze their structure, word choice, and psychological triggers
3. Choose the BEST ONE that fits this video topic
4. COPY its exact linguistic pattern and adapt it to this video

**User's Custom Hooks:**
${formState.custom_hooks}

Remember: ANALYZE all of them, CHOOSE the best fit, then MIMIC its exact style for your opening.`;
        } else if (hookExamples.length > 0) {
          // Pick 5-7 random hooks from knowledge base
          const numHooks = Math.min(7, hookExamples.length);
          const selectedHooks = [];
          const usedIndices = new Set();

          while (selectedHooks.length < numHooks) {
            const randomIndex = Math.floor(Math.random() * hookExamples.length);
            if (!usedIndices.has(randomIndex)) {
              usedIndices.add(randomIndex);
              selectedHooks.push(hookExamples[randomIndex].content);
            }
          }

          prompt += `\n\n**🪝 CRITICAL HOOK INSTRUCTION - KNOWLEDGE BASE HOOKS**
Below are ${numHooks} high-performing hooks from your niche. You MUST:
1. Read ALL of them carefully
2. Analyze which one has the:
   - Strongest curiosity gap
   - Best match for this video topic
   - Most authentic and modern language
   - Clearest value proposition
3. Choose the BEST ONE for this video
4. COPY its exact linguistic pattern, sentence structure, and psychological triggers
5. Adapt only the specific facts to match this video's topic

**DO NOT:**
- Blend multiple hooks together
- Create something "new" from scratch
- Use your default formal writing style

**YOU MUST:**
- Pick ONE best hook
- Mimic its exact style and structure
- Make it feel like that hook wrote about THIS topic

**The ${numHooks} High-Performing Hooks:**
${selectedHooks.map((hook, idx) => `\n--- HOOK ${idx + 1} ---\n${hook}\n`).join('\n')}

Remember: CHOOSE ONE, COPY its style EXACTLY, adapt the content to this video.`;
        }

        // Handle full script templates
        if (formState.inspiration_script) {
          prompt += `\n\n**🎯 STYLE REFERENCE - FOR INSPIRATION ONLY 🎯**

⚠️ **IMPORTANT:**
The script below is from a DIFFERENT BUSINESS. Use it as INSPIRATION for style and structure, but DO NOT copy it directly.

**Use this script to understand:**
- The general tone and energy level
- How sentences flow and connect
- The approximate length and pacing
- The type of language used (formal vs casual)

**DO NOT copy:**
- Specific claims, features, or product details
- Exact phrases or sentences
- Any information not in your Business Profile above

**THE REFERENCE (For Inspiration Only):**
${formState.inspiration_script}

**YOUR TASK:** Create original content about THIS business (from Business Profile above) that has a SIMILAR feel and style to the reference.`;
        } else if (fullScriptExamples.length > 0) {
          // Pick 3 random examples (or fewer if not enough)
          const numExamples = Math.min(3, fullScriptExamples.length);
          const selectedExamples = [];
          const usedIndices = new Set();

          while (selectedExamples.length < numExamples) {
            const randomIndex = Math.floor(Math.random() * fullScriptExamples.length);
            if (!usedIndices.has(randomIndex)) {
              usedIndices.add(randomIndex);
              selectedExamples.push(fullScriptExamples[randomIndex].content);
            }
          }

          prompt += `\n\n**🎯 STYLE REFERENCE - FOR INSPIRATION ONLY 🎯**

⚠️ **IMPORTANT:**
The scripts below are from DIFFERENT BUSINESSES. Use them as INSPIRATION for style and structure, but DO NOT copy them directly.

**Use these scripts to understand:**
- The general tone and energy level
- How sentences flow and connect
- The approximate length and pacing
- The type of language used (formal vs casual)

**DO NOT copy:**
- Specific claims, features, or product details
- Exact phrases or sentences
- Any information not in your Business Profile above

**The ${numExamples} Style References (For Inspiration Only):**
${selectedExamples.map((ex, idx) => `\n--- REFERENCE ${idx + 1} ---\n${ex}\n`).join('\n')}

**YOUR TASK:** Create original content about THIS business (from Business Profile above) that has a SIMILAR feel and style to these references.`;
        } else {
          prompt += `\n\n**CRITICAL VALUE CREATION INSTRUCTION:**
No example scripts are available, so you MUST create extremely valuable, specific content by:
1. Drawing deeply from the Business Profile details above
2. Creating unique frameworks based on the business's expertise
3. Using the Client Results as case studies and proof points WITH SPECIFIC NUMBERS
4. Telling the Business Story in a compelling, credible way (using modern, conversational language)
5. Providing hyper-specific, actionable advice (not generic platitudes)
6. Building authority through demonstrated expertise and results
7. Writing in a natural, modern social media voice (review the TONE OF VOICE section above)
8. Taking a contrarian stance on something in your niche`;
        }

        prompt += `\n\n**USER'S DETAILED REQUEST**
${JSON.stringify(formState, null, 2)}

**FINAL QUALITY CHECKLIST - YOUR SCRIPT MUST:**
✓ Open with a UNIQUE, MODERN hook with specific numbers/results (NOT "Let's talk about...")
✓ Use contemporary, conversational language throughout (NO archaic or overly formal phrases)
✓ Include at least 1-2 unique, NAMED frameworks or systems
✓ Reference SPECIFIC numbers from Client Results (follower counts, revenue, time frames)
✓ Tell personal stories that build credibility in a natural, relatable way
✓ Provide actionable steps (not motivational fluff or generic advice)
✓ Progress logically through NEW information in each section
✓ Include a contrarian take or unique angle on the topic
✓ Product mentions = 5% MAX of script (soft, natural mentions only)
✓ Create curiosity and engagement throughout
✓ Integrate natural, earned CTAs
✓ Sound like a real person speaking on camera, NOT like written content
✓ NEVER use any banned phrases listed above
✓ ONLY use facts, features, and claims from the Business Profile - NEVER from examples`;

        console.log("📤 Sending to backend - Prompt length:", prompt.length);

        // Call the backend function with THE FULL PROMPT
        const response = await base44.functions.invoke('generateYouTubeScript', {
          prompt: prompt,
          videoLength: formState.video_length || 10
        });

        console.log("📥 Backend response:", response.data);

        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to generate script from backend');
        }

        let contentToSave = response.data.script;

        // Post-process to remove any accidental prompt echoes or internal outline markers
        const lines = contentToSave.split('\n');
        const filteredLines = lines.filter((line) => {
          const trimmedLine = line.trim();
          // Remove example/hook markers that might be echoed
          if (trimmedLine.startsWith('--- EXAMPLE') || trimmedLine.startsWith('--- HOOK') || trimmedLine.startsWith('--- TEMPLATE') || trimmedLine.startsWith('--- REFERENCE')) {
            return false;
          }
          // Remove checklist elements that might be echoed
          if (trimmedLine.startsWith('FINAL QUALITY CHECKLIST') || trimmedLine.startsWith('YOUR SCRIPT MUST') || trimmedLine.startsWith('✓')) {
            return false;
          }
          // Also remove lines that seem to be just section headers from the prompt itself like "CRITICAL INSTRUCTION"
          if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) { // Catch bolded prompt section headers
            const cleanedHeader = trimmedLine.replace(/\*+/g, '').trim();
            // Heuristic: if it looks like a prompt instruction header, remove it.
            if (cleanedHeader.includes('INSTRUCTION') || cleanedHeader.includes('CONTEXT') || cleanedHeader.includes('MANDATORY') || cleanedHeader.includes('TRUTH SOURCE') || cleanedHeader.includes('TASK') || cleanedHeader.includes('WHAT TO COPY') || cleanedHeader.includes('WHAT TO ABSOLUTELY IGNORE') || cleanedHeader.includes('NOW CREATE YOUR SCRIPT') || cleanedHeader.includes('CRITICAL')) {
              return false;
            }
          }
          // Keep actual content
          return true;
        });
        contentToSave = filteredLines.join('\n').trim(); // Trim final result to remove leading/trailing blank lines

        await base44.entities.GeneratedContent.create({
          title: `${generatorConfig.title} - ${formState.request.substring(0, 30)}...`,
          content_type: selectedType,
          content: contentToSave,
          prompt_used: `Request: ${formState.request}`,
          business_profile_id: activeProfile.id
        });

        await incrementGenerations();

        return contentToSave;
      } catch (error) {
        console.error("❌ YouTube generation error:", error);
        alert(`Error generating YouTube script: ${error.message || 'An unknown error occurred.'}`);
        return null;
      }
    }

    // Existing logic for other generators (non-YouTube)
    const isSequence = sequenceGenerators.includes(selectedType);

    // Use the selected niche from the form, fallback to profile niche
    const effectiveNiche = formState.selected_niche || activeProfile.niche;

    // Fetch knowledge items
    const [allGuidelines, allExamples] = await Promise.all([
      base44.entities.AppKnowledge.filter({ target_generator: selectedType, knowledge_type: 'guidelines' }),
      base44.entities.AppKnowledge.filter({ target_generator: selectedType, knowledge_type: 'examples' })
    ]);

    // Fetch last posted content from calendar for AI context
    const postedContent = await base44.entities.CalendarPost.filter({
      business_profile_id: activeProfile.id,
      status: 'posted'
    }, '-date');

    const lastSocialPosts = postedContent
      .filter(p => p.content_type === 'social_media')
      .slice(0, 10)
      .map(p => p.content);

    const lastYoutubePosts = postedContent
      .filter(p => p.content_type === 'youtube')
      .slice(0, 3)
      .map(p => p.content);

    // Filter examples by the EFFECTIVE niche - no more post_format filtering
    let examples = allExamples.filter((k) => !k.niche_tags || k.niche_tags.length === 0 || k.niche_tags.includes(effectiveNiche));

    // Filter guidelines - no post_format filtering
    let guidelines = allGuidelines;
    const guidelinesContent = guidelines.length > 0 ? guidelines[0].content : null;

    // ========== START BUILDING THE PROMPT ==========

    // 1. INTRO / ROLE CONTEXT (with niche-specific addition based on EFFECTIVE niche)
    const baseRoleContext = roleContexts[selectedType] || "You are an expert content strategist and copywriter. Your task is to generate high-quality, on-brand content based on the user's business/personal brand profile and their specific request.";
    const nicheContext = nicheRoleContexts[effectiveNiche] || "";

    let prompt = baseRoleContext;
    if (nicheContext) {
      prompt += ` ${nicheContext}`;
    }

    // Add sequence instruction if needed
    if (isSequence) {
      prompt += '\nYour output for a sequence MUST be a JSON array of objects, with no text outside the array.';
    }

    // 2. CRITICAL GENERAL INSTRUCTION
    prompt += `\n\n**CRITICAL GENERAL INSTRUCTION**
Do NOT include any visual descriptions, image suggestions, or calls for visual elements in your output. Focus ONLY on providing pure text content without any emojis.`;

    // 3. CONTEXT: BUSINESS PROFILE
    prompt += `\n\n**CONTEXT: BUSINESS PROFILE**
- Business Name: ${activeProfile.business_name}
- Business Type: ${activeProfile.business_type}
- Niche: ${activeProfile.niche}
- Offer Statement: ${activeProfile.offer_statement || 'Not provided'}
- Content Interests: ${activeProfile.content_interests || 'Not provided'}
- Target Audience: ${activeProfile.target_audience || 'Not provided'}
- Audience Pains: ${activeProfile.audience_pains || 'Not provided'}
- Business Story: ${activeProfile.business_story || 'Not provided'}
- Desired Outcome: ${activeProfile.desired_outcome || 'Not provided'}
- Customer Objections: ${activeProfile.customer_objections || 'Not provided'}
- Offer Structure: ${activeProfile.offer_structure || 'Not provided'}
- Unique Selling Proposition: ${activeProfile.usp || 'Not provided'}
- Client Results: ${activeProfile.client_results || 'Not provided'}
- Client Count: ${activeProfile.client_count || 'Not provided'}
- Tone of Voice / Existing Content: ${activeProfile.existing_content_scripts || 'Not provided'}`;

    // 4. ADD POSTED CONTENT CONTEXT
    if (lastSocialPosts.length > 0 || lastYoutubePosts.length > 0) {
      prompt += `\n\n**CONTEXT: RECENTLY POSTED CONTENT**
This is content the user has recently posted and marked as published. Use this to understand their current messaging, topics, and style evolution:`;

      if (lastSocialPosts.length > 0) {
        prompt += `\n\n**Last ${lastSocialPosts.length} Social Media Posts:**\n`;
        lastSocialPosts.forEach((post, idx) => {
          prompt += `\nPost ${idx + 1}:\n${post.substring(0, 500)}${post.length > 500 ? '...' : ''}\n`;
        });
      }

      if (lastYoutubePosts.length > 0) {
        prompt += `\n\n**Last ${lastYoutubePosts.length} YouTube Scripts:**\n`;
        lastYoutubePosts.forEach((post, idx) => {
          prompt += `\nScript ${idx + 1}:\n${post.substring(0, 800)}${post.length > 800 ? '...' : ''}\n`;
        });
      }
    }

    // 5. CRITICAL: TARGET PLATFORMS (generalized for social posts)
    if (selectedType === 'social_post' && formState.platforms && formState.platforms.length > 0) {
      prompt += `\n\n**CRITICAL: TARGET PLATFORMS**
This content is specifically for social media platforms. Tailor the content, tone, and format to match the best practices of engaging social media content with strong captions and storytelling.`;
    }

    // 5b. LENGTH REQUIREMENT for social posts
    if (selectedType === 'social_post' && formState.length) {
      const lengthLimits = {
        'very_short': { min: 85, max: 100 },
        'short': { min: 298, max: 350 },
        'medium': { min: 595, max: 700 },
        'long': { min: 1190, max: 1400 },
        'very_long': { min: 2380, max: 2800 }
      };
      
      const limits = lengthLimits[formState.length];
      if (limits) {
        prompt += `\n\n**CRITICAL: LENGTH REQUIREMENT**
The caption MUST be between ${limits.min} and ${limits.max} characters in length. This is a strict requirement - do not exceed or fall short of these limits.`;
      }
    }

    // 6. CRITICAL STRUCTURE INSTRUCTION (from guidelines)
    if (guidelinesContent) {
      prompt += `\n\n**CRITICAL STRUCTURE INSTRUCTION**
Follow this structure when creating the content:
${guidelinesContent}`;
    }

    // 7. STYLE REFERENCE (from random example OR user inspiration) - SOFTENED
    if (formState.inspiration_script) {
      // User provided their own inspiration script
      prompt += `\n\n**STYLE REFERENCE - FOR INSPIRATION ONLY**

⚠️ **IMPORTANT:**
The script below is from a DIFFERENT BUSINESS. Use it as INSPIRATION for style and structure, but DO NOT copy it directly.

**Use this script to understand:**
- The general tone and energy level
- How sentences flow and connect
- The approximate length and pacing
- The type of language used (formal vs casual)

**DO NOT copy:**
- Specific claims, features, or product details
- Exact phrases or sentences
- Any information not in your Business Profile above

**THE REFERENCE (For Inspiration Only):**
${formState.inspiration_script}

**YOUR TASK:** Create original content about THIS business (from Business Profile above) that has a SIMILAR feel and style to the reference.`;
    } else if (examples.length > 0) {
      // Randomly pick ONE example from the filtered examples
      const randomIndex = Math.floor(Math.random() * examples.length);
      const selectedExample = examples[randomIndex].content;
      prompt += `\n\n**STYLE REFERENCE - FOR INSPIRATION ONLY**

⚠️ **IMPORTANT:**
The script below is from a DIFFERENT BUSINESS. Use it as INSPIRATION for style and structure, but DO NOT copy it directly.

**Use this script to understand:**
- The general tone and energy level
- How sentences flow and connect
- The approximate length and pacing
- The type of language used (formal vs casual)

**DO NOT copy:**
- Specific claims, features, or product details
- Exact phrases or sentences
- Any information not in your Business Profile above

**THE REFERENCE (For Inspiration Only):**
${selectedExample}

**YOUR TASK:** Create original content about THIS business (from Business Profile above) that has a SIMILAR feel and style to the reference.`;
    }

    // 8. USER'S DETAILED REQUEST
    prompt += `\n\n**USER'S DETAILED REQUEST**
${JSON.stringify(formState, null, 2)}`;

    // Call Gemini via the backend function
    const response = await base44.functions.invoke('invokeGemini', {
      prompt,
      response_json_schema: selectedType === 'social_post' ? {
        type: "object",
        properties: {
          caption: { type: "string" },
          hashtags: { type: "array", items: { type: "string" } },
          call_to_action: { type: "string" }
        }
      } : isSequence ? {
        type: "object",
        properties: { sequence: { type: "array", items: { type: "object" } } }
      } : null
    });

    if (!response.data.response) {
      throw new Error('No response from Gemini');
    }

    let contentToSave;
    if (selectedType === 'social_post') {
      contentToSave = JSON.stringify(response.data.response);
    } else if (isSequence) {
      contentToSave = JSON.stringify(response.data.response.sequence || response.data.response);
    } else {
      contentToSave = response.data.response;
    }

    await base44.entities.GeneratedContent.create({
      title: `${generatorConfig.title} for ${formState.request.substring(0, 30)}...`,
      content_type: selectedType,
      content: contentToSave,
      prompt_used: `Request: ${formState.request}`,
      business_profile_id: activeProfile.id
    });

    await incrementGenerations();

    return contentToSave;
  };

  if (isProfileLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
  }

  return (
    <div className="space-y-3 sm:space-y-6 md:space-y-8 pb-4 sm:pb-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-3 sm:px-0">
        <div className="flex items-center gap-3 md:gap-4">
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="ghost" size="icon" className="hover:bg-white/50">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Content Generators
            </h1>
            <p className="text-slate-600 mt-1 text-sm md:text-base">
              Creating amazing content tailored to {activeProfile?.business_name || 'your business'}
            </p>
            {userTier === 'free' &&
              <p className="text-orange-600 text-xs md:text-sm mt-1 font-medium">
                Free Plan: {generationsUsed}/15 generations used
              </p>
            }
          </div>
        </div>
      </motion.div>

      {!activeProfile ?
        <div className="max-w-2xl mx-auto px-3 sm:px-0">
          <Card className="border border-slate-200 bg-white">
            <CardContent className="p-6 sm:p-8 md:p-12 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Setup Required</h2>
              <p className="text-slate-600 mb-6 text-sm md:text-base">You need to set up your business profile before generating content</p>
              <Link to={createPageUrl("BusinessProfile")}>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 w-full md:w-auto">
                  Setup Business Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div> :
        !canGenerate() ?
          <div className="max-w-2xl mx-auto px-3 sm:px-0">
            <Card className="border border-slate-200 bg-white">
              <CardContent className="p-6 sm:p-8 md:p-12 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Generation Limit Reached</h2>

                <Link to={createPageUrl("Account")}>
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 w-full md:w-auto">
                    Upgrade Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div> :
          !selectedType ?
            <div className="px-3 sm:px-0">
              <GeneratorSelector onSelect={setSelectedType} />
            </div> :

            <ContentGenerator type={selectedType} profile={activeProfile} onGenerate={handleGenerate} onBack={() => setSelectedType(null)} />
      }
    </div>
  );
}
