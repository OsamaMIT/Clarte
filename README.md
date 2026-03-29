# Clarity
Bridging communication gaps with an AI-powered tool that provides context for digital texts on the web.
<br/><br/>
<img width="300" height="300" alt="logo" src="https://github.com/user-attachments/assets/eca69a0d-99f0-4256-b9e7-6948471f784c" />
<br/><br/>

Clarity is an AI-powered browser extension that is avaliable when a user highlights text and selects the “Clarity” option. It generates a popup that explains what the selected text means in its specific context. The system gathers surrounding text (before and after the selection) and uses page information such as the URL to understand the topic and produce a concise, context-aware explanation.

# Installation Guide

Download the release file: **Clarity.zip**

## Install in Chrome

1. Unzip `Clarity.zip` to a folder on your computer.
2. Open Google Chrome, Brave, or any Chromium based browser.
3. Go to `chrome://extensions/` or open your extensions menu.
4. Turn on **Developer mode** using the toggle in the top-right corner.
5. Click **Load unpacked**.
6. Go into the unzipped **Clarity** folder, and select the ```/dist``` folder.

- If the extension does not appear to work after updating files, go back to `chrome://extensions/` and click **Reload** on Clarity.
- The extension requires an API key, for hackathon demo purposes you can paste your own Gemini key. Open the extension settings/options and paste your Gemini API key there. The extension uses Gemma, which is an open source model, and therefore requires no billed credits.
  
# Using the Extension

1. Open any webpage.
2. Highlight a word or phrase.
3. Right-click the highlighted text.
4. Click **Explain Context**.

- Settings can be changed from the extensions options or by clicking on the extension in extensions menu on the the top right of the browser.

## Troubleshooting

### The extension does not load
- Make sure you selected the **unzipped folder**, not the `.zip` file.
- Make sure the folder contains `manifest.json`.

### The right-click option does not appear
- Refresh the webpage after installing the extension.
- Try again on a normal webpage where text can be selected.

### The extension still shows an older version
- Go to `chrome://extensions/`
- Find **Clarity**
- Click **Reload**


## Example Testcases
### Longer Texts
It’s two men in the middle of this ring. Both of us bloodied, drenched in hate for one another’s need to win, with each holding one more move in hand. When did it turn from competition to desperation? I’ve climbed that top rope far too much, been in head locks far too long, another moment of weakness, another chance for him to capitalize on my vulnerability, and my back won’t make it off the ground in time for the count. How long’s this fight been? I can’t call back to the start of it any longer. It’s as though I’m drowning in a memory I’m forced to hold my breath in. I can feel the consecutive hits, the bruises forming, and bones growing stiff. I want no part of it. The greater side of my jaw’s taken forearm after forearm, the more I get taken down, the more I hope a submission maneuver rids me of this pain. I’d tap, given the opportunity to do so without seemingly giving up, I’d tap till I’m let go of, but as long as there’s a crowd chanting I can’t quite raise a flag. Loved ones have shown up for me in this dying moment. It’s either I hold onto this rope and use it, or fall onto the floor and hear you sigh of disappointment while I sigh of relief. I’ll use whatever’s left of my legs and pull through. I’ll sling back into this ring, and **buckshot lariat**.

### Colloquial Phrases

1. Generational Gap:
   
```That’s fire```

2. Language Gap (Native vs Non-Native):
   
```Let’s circle back on this```

3. Domain/Technical Context:
   
```This API is stateless```

4. Linguistic Context (Word Usage in Context):
   
```He’s cold```

5. Generational Gap pt2:


```The internet meme "six seven" is taking the world by storm. kids will just say six seven at any thing and laugh```
