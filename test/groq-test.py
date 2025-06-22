from groq import Groq

client = Groq(api_key="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")
completion = client.chat.completions.create(
    model="gemma2-9b-it",
    messages=[
      {
        "role": "user",
        "content": "Create a detailed Manim animation that visually explains the process of protein synthesis in eukaryotic cells, from transcription to translation to protein folding.\nYour animation should depict the following biological stages clearly and dynamically:\nTranscription Initiation\nShow a double-stranded DNA molecule.\nHighlight a gene region.\nAnimate the unwinding of the DNA.\nIntroduce RNA polymerase as a moving entity that binds to the promoter region.\nTranscription Elongation\nAnimate RNA polymerase moving along the DNA strand from 3’ to 5’.\nSimulate synthesis of a complementary mRNA strand as RNA polymerase progresses.\nShow base-pairing between DNA and growing RNA.\nTranscription Termination\nShow RNA polymerase releasing the complete mRNA strand.\nAnimate the rewinding of DNA back into a double helix.\nmRNA Transport\nSimulate mRNA moving out of the nucleus (represented spatially if possible).\nIndicate transition from transcription to translation.\nTranslation Initiation\nIntroduce a ribosome that binds to the 5’ end of the mRNA.\nLabel the ribosome clearly.\nTranslation Elongation\nIntroduce multiple tRNA molecules.\nFor each codon on the mRNA, show a tRNA arriving with its anticodon and corresponding amino acid.\nAnimate the transfer of the amino acid to the growing polypeptide chain.\nShow the ribosome moving codon by codon.\nTranslation Termination\nWhen the ribosome reaches a stop codon, animate release of the complete polypeptide chain.\nShow the ribosome detaching from mRNA.\nProtein Folding\nVisually transform the polypeptide chain into a folded 3D-like structure.\nIndicate a functional protein at the end.\nInclude on-screen labels for key molecules and steps (e.g., DNA, RNA polymerase, mRNA, tRNA, amino acids, ribosome, start codon, stop codon).\nUse Manim primitives (like Circles, Arrows, Text, Dots, Lines, etc.) to represent molecular components and their interactions.\nMake the animation biologically accurate, clean, and smooth. You can abstract biological complexity when needed but preserve clarity and instructional value.\nOutput only the final Manim Python code for the animation, using a class called ProteinSynthesis, with comments describing each scene step."
      }
    ],
    temperature=1,
    max_completion_tokens=8192,
    top_p=1,
    stream=True,
    stop=None,
)

out = ""
for chunk in completion:
    cur_str = chunk.choices[0].delta.content
    if cur_str != None: out += cur_str 
with open("test/groq_out.py", 'w') as f:
        f.write(out)
