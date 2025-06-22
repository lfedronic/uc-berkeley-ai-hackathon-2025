
from manim import *

class ProteinSynthesis(Scene):
    def construct(self):
        # --- Transcription --- 
        
        # 1. Double-stranded DNA
        dna = DoubleDNA("ATGCGTAGCATCGATCG", color=blue, fontsize=20)
        self.add(dna)
        
        # 2. Highlights Gene Region
        highlight_region = Tex("Gene", color=red) 
        highlight_region.next_to(dna.get_text()[0:5], UP)
        self.add(highlight_region)
        
        # 3. DNA Unwinding
        self.play(dna.unwind(1, highlight_region.get_center()))

        # 4. RNA Polymerase Arrival
        rna_polymerase = Circle(color=green, radius=0.2)
        promoter = Tex("Promoter")
        promoter.next_to(dna.get_text()[0], LEFT, buff=0.2)
        
        self.add(rna_polymerase, promoter)
        self.play(
            MoveToTarget(rna_polymerase, promoter.get_center())
        )
        
        # 5. Transcription Elongation
        mrna_strand = Tex("")
        self.add(mrna_strand)
        
        for i in range(len(dna.get_text())):
            char = dna.get_text()[i]
            
            # Add base pairing
            if char == "A":
                mrna_strand.append("U")
            elif char == "T":
                mrna_strand.append("A")
            elif char == "G":
                mrna_strand.append("C")
            elif char == "C":
                mrna_strand.append("G")

            self.play(
                rna_polymerase.shift(0.2*LEFT),
                mrna_strand.append(Tex(mrna_strand[-1],color=red)),
            )
            
        # 6. Transcription Termination
        self.play(
            mrna_strand.set_color(blue),
            FadeOut(rna_polymerase),
            dna.rewind(highlight_region.get_center())
        )

        # --- mRNA Transport ---      
        self.add(Rectangle(color=pink, width=1, height=0.5,  fill_opacity=0.5))

        
        self.play(
            mrna_strand.move_to(RIGHT * 2, run_time=2),
            Scale(mrna_strand, 0.7), 
            Text("mRNA is transported out of the nucleus", color=white).scale(0.8).to_corner(UR, buff=1)
        )
        
        # --- Translation ---    
        
        # 7. Translation Initiation
        ribosome = Circle(color=yellow, radius=0.3)
        start_codon = Tex("AUG")
        
        self.add(ribosome, start_codon)
        self.play(
            ribosome.next_to(mrna_strand, direction=DOWN),
            Text("Translation begins", color=white).scale(0.8).to_corner(UR, buff=1)
        )
        
        # 8. Translation Elongation
        for i in range(4):  # Example 
            codon = mrna_strand[i]
            
            tRNA = VGroup(*[
                Line(color=red, start=LEFT*0.5, end=RIGHT*2),
                Circle(color=orange, radius=0.2),
                
            ])
            amino_acid = "\\AA"  # Replace with actual amino acid based on codon
            tRNA[1].next_to(tRNA[0], 0.5*UP)  
            
            self.add(tRNA)
            self.play(
                ShowCreation(tRNA),
                tRNA[0].set_color(green),
                Text(amino_acid, color=blue).next_to(tRNA[1].get_center(), UP)
            )

        # 9. Translation Termination
        
        stop_codon = Tex("UAA")
        self.add(stop_codon)
        
        self.play(
            Stopwatch(minutes=0, seconds=2).move_to(UP),
            stop_codon.next_to(mrna_strand[4], direction=DOWN)
        )
        
        # --- Protein Folding --- 
        peptide_chain = Line(color=blue, start=DOWN*1, end=UP*1)
        self.add(peptide_chain)
        
        self.play(    
            Unfold(peptide_chain),
            Text("Protein Folding", color=white).scale(0.8).to_corner(UR, buff=1)
        ) 

        




