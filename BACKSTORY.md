# Backstory

The motivation for this project was to attempt to build a meeting-to-execution agent.  Everyone hates the gap between talking and doing.  In this scenario, a meeting happens.
As much as possible afterward happens automatically.  So the input is a meeting transcript, and we want it to extract decisions, build a requirements doc or specification with exit criteria of what success looks like, create issues/work items, build draft PRs, execute as much as possible, and generate a status page of the progress.

I used the Copilot CLI with GPT-6-Astra as the underlying model.  

> [!NOTE]
> Everything in this repository other than this Backstory page was generated this way.  This includes the source code and the issues.  

For a hackathon, I had created some sample data of a [meeting transcript](./meeting-to-discuss-software.vtt), which is included in this repo.  This was created in the following manner: a group of teammates and I basically improvised the conversation.  Prior to the conversation, I assigned some personas so we could discuss/argue about our fictional software in this meeting.  These roles/specific things to be passionate about were chosen so that we would get a good conversation where Responsible AI concerns were raised and there would be some big ambiguous questions left open.  

Below is the overall story and the instructions that I gave the team to improvise the meeting.  
 
## Overall Story
We are a consulting group, and we are all peers so we need to come to agreement with discussion, not hierarchy.  Jennifer has just met with the client and is bringing back the project and explaining it to the group. 
 
Jennifer: The client wants an app to help with weight loss.  Ideally web, iPhone, and Android, but we can go one by one if needed.  They seemed open to our recommendations on which ones to tackle first.  With the rise of GLP-1s and everything, there is a big surge in interest and huge market for weight loss apps.  I’m worried that it’s a pretty saturated market, but that’s what the client is asking for.  So we need to figure out how to differentiate. 
 
Now “helping with weight loss” is a very ambiguous goal and there are lots of ways we could tackle this: calorie counter, activity tracker, steps counter, logging weight, designing workouts, offering personalized advice, tracking things like sleep and water intake and stress that contribute to weight loss. Integration with other fitness apps.  Features like picture-taking of meal to log calories will require AI. 
 
What to do:
Everyone can argue about what is most important and add feature ideas that they think would be helpful – pretend you are a PM/engineer/designer/etc who seriously has to build this for the client.  Everyone should contribute as much as they can with real ideas on how to build this and what features we need.  In addition, each person has a particular focus that they should be passionate about during the conversation: 
 
+ **Person 0 (Jennifer)**: explains the scenario and keeps the conversation moving forward.
+ **Person 1 (Alex)**: Big focus on RAI, obsessed with data privacy aspects, concerns about eating disorders and body dysmorphia.  
+ **Person 2 (Sarah)**: Keeps bringing up business aspects – how is this app going to make money?  What is the business model?  What features should be upsells? 
+ **Person 3 (Weishung)**: Obsessed with gamification.  Big fan of Duolingo and wants to add lots of quests and motivators to the app.  Keeps bringing up ideas around this. 
+ **Person 4 (Jennifer/Nadia)**: Wants to integrate AI as much as possible, very obsessed with adding features that require AI – like taking picture of food and using AI to convert to food log with calorie/macro/protein/etc. amounts, AI to personalize your workout routine, AI to recommend healthier food swaps, etc. 
+ **Person 5 (Idan)**: Loves wearables and keeps bringing up how to integrate them.  Smart watches, FitBits, heart trackers, smart scales that measure body fat composition, etc. in addition to phone app. 
 
Thank you for participating!  This will be fun.  Our output will be the meeting transcript that is the input to the Meeting-to-Execution project, so one hackathon project will be figuring out how to build a spec from our conversation and implement it.  
