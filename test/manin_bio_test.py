# Manim Community v0.17.3
from manim import *

class ProteinSynthesis(MovingCameraScene):
    """
    An animation visually explaining the process of protein synthesis in eukaryotic cells.
    This version corrects all object tracking and access errors to ensure a smooth,
    bug-free animation without LaTeX dependencies.
    """
    def construct(self):
        # --- SCENE SETUP ---
        self.camera.frame.scale(1.3)

        # --- RUN ANIMATION STAGES ---
        # Each function now correctly passes and cleans up its objects.
        transcription_objects = self.play_transcription()
        mrna_strand = self.play_mrna_transport(transcription_objects)
        polypeptide_chain = self.play_translation(mrna_strand)
        self.play_protein_folding(polypeptide_chain)

        self.wait(2)

    def play_transcription(self):
        """STAGE 1: TRANSCRIPTION"""
        title = Text("1. Transcription: DNA to mRNA", font_size=40).to_edge(UP)
        self.play(Write(title))

        # Create DNA and store its original shape for rewinding later
        dna_helix = VGroup(*[
            ParametricFunction(lambda t: [t, 0.2 * np.sin(t * 2 * PI / 3), 0], t_range=[-5, 5], color=BLUE),
            ParametricFunction(lambda t: [t, -0.2 * np.sin(t * 2 * PI / 3), 0], t_range=[-5, 5], color=BLUE_E)
        ]).center()
        original_dna_shape = dna_helix.copy()
        
        dna_label = Text("DNA", font_size=24).next_to(dna_helix, DOWN, buff=0.2)
        self.play(Create(dna_helix), Write(dna_label))
        self.wait(1)

        gene_region = dna_helix.copy().stretch(0.5, 0).move_to(dna_helix).shift(LEFT * 0.7)
        gene_brace = Brace(gene_region, UP, buff=0.2)
        gene_label = Text("Gene", font_size=24).next_to(gene_brace, UP, buff=0.1)
        promoter_label = Text("Promoter", font_size=20, color=YELLOW).next_to(gene_brace, UP, buff=0.1).align_to(gene_brace, LEFT)
        self.play(GrowFromCenter(gene_brace), Write(gene_label), Write(promoter_label))
        self.wait(1)

        unwound_dna_shape = VGroup(
            Line(gene_brace.get_left() + DOWN * 0.2, gene_brace.get_right() + UP * 0.2, color=BLUE),
            Line(gene_brace.get_left() + UP * 0.2, gene_brace.get_right() + DOWN * 0.2, color=BLUE_E)
        ).move_to(dna_helix)
        
        self.play(
            dna_helix.animate.become(unwound_dna_shape),
            FadeOut(gene_brace, gene_label),
            promoter_label.animate.next_to(unwound_dna_shape, UP, buff=0.5).align_to(unwound_dna_shape, LEFT)
        )
        
        template_strand = dna_helix[0]
        ticks = VGroup(*[Line(UP, DOWN, stroke_width=2, color=GRAY).scale(0.1).move_to(template_strand.point_from_proportion(p)) for p in np.linspace(0.1, 0.9, 10)])
        template_label = Text("Template Strand (3-prime to 5-prime)", font_size=18).next_to(template_strand, DOWN, buff=0.1)
        self.play(Create(ticks), Write(template_label))

        rna_polymerase = VGroup(Circle(radius=0.5, color=GREEN, fill_opacity=0.8), Text("RNA Polymerase", font_size=20)).arrange(DOWN, buff=0.1)
        rna_polymerase.move_to(dna_helix.get_left() + LEFT*0.5)
        self.play(FadeIn(rna_polymerase, scale=0.5))
        self.play(rna_polymerase.animate.move_to(dna_helix.get_left()), FadeOut(promoter_label))

        mrna_strand = Line(dna_helix.get_left(), dna_helix.get_left(), color=RED, stroke_width=4)
        self.add(mrna_strand)
        elongation_label = Text("Elongation", font_size=28).next_to(rna_polymerase, UP, buff=1.0)
        self.play(Write(elongation_label))

        self.play(
            rna_polymerase.animate.move_to(dna_helix.get_right()).set_run_time(5),
            UpdateFromFunc(mrna_strand, lambda m: m.put_start_and_end_on(dna_helix.get_left() + UP*0.05, rna_polymerase.get_center()))
        )

        termination_label = Text("Termination", font_size=28).move_to(elongation_label)
        self.play(ReplacementTransform(elongation_label, termination_label))
        
        mrna_final = mrna_strand.copy()
        mrna_label = Text("mRNA", font_size=24, color=RED).next_to(mrna_final, RIGHT)
        
        self.play(
            rna_polymerase.animate.shift(UP * 2 + RIGHT * 0.5),
            mrna_final.animate.shift(DOWN * 1.5),
            FadeOut(mrna_strand)
        )
        self.play(Write(mrna_label))

        self.play(
            dna_helix.animate.become(original_dna_shape.move_to(dna_helix.get_center())),
            FadeOut(ticks, template_label)
        )
        self.wait(1)
        
        # We bundle all on-screen objects into a VGroup to pass to the next function for cleanup.
        return VGroup(title, dna_helix, dna_label, rna_polymerase, mrna_final, mrna_label, termination_label)

    def play_mrna_transport(self, transcription_objects):
        """STAGE 2: MRNA TRANSPORT"""
        # FIX: Access objects by their index in the VGroup. This is reliable.
        mrna_final = transcription_objects[4]
        mrna_label = transcription_objects[5]
        
        nucleus_center = transcription_objects[1].get_center() # Center on DNA's position
        nucleus = Circle(radius=3.5, color=GRAY_BROWN, stroke_width=8).move_to(nucleus_center)
        nucleus_label = Text("Nucleus", font_size=30).next_to(nucleus, UP, buff=0.2)
        
        self.play(
            Create(nucleus), Write(nucleus_label),
            transcription_objects.animate.scale(0.8).move_to(nucleus.get_center())
        )
        self.wait(1)

        cytoplasm_label = Text("Cytoplasm", font_size=30).to_edge(RIGHT, buff=1.0)
        transport_title = Text("mRNA Transport", font_size=30).next_to(nucleus, DOWN, buff=0.2)
        exit_point = nucleus.point_from_proportion(0.95)
        
        self.play(Write(transport_title))
        self.play(
            mrna_final.animate.scale(1.2).move_to(exit_point + RIGHT * 2.5),
            mrna_label.animate.next_to(mrna_final, RIGHT, buff=0.2),
            Write(cytoplasm_label)
        )
        self.wait(1)

        mrna_to_keep = mrna_final.copy()
        
        # FIX: Fade out the entire group of objects from the previous scene. This prevents leftovers.
        self.play(
            FadeOut(*transcription_objects), FadeOut(nucleus), FadeOut(nucleus_label),
            FadeOut(cytoplasm_label), FadeOut(transport_title), FadeOut(mrna_label)
        )
        self.play(mrna_to_keep.animate.center().scale(1.5))
        return mrna_to_keep

    def play_translation(self, mrna_strand):
        """STAGE 3: TRANSLATION"""
        title = Text("2. Translation: mRNA to Protein", font_size=40).to_edge(UP)
        self.play(Write(title))

        mrna_codons_text = "5-prime - AUG UCU GGC UAG - 3-prime"
        mrna_codons = Text(mrna_codons_text, font_size=24, t2c={"AUG": YELLOW, "UAG": ORANGE}).next_to(mrna_strand, DOWN)
        self.add(mrna_codons)
        
        ribosome = VGroup(Circle(radius=0.8, color=PURPLE), Circle(radius=0.5, color=PURPLE_A).shift(DOWN*0.3)).scale(0.8)
        ribosome_label = Text("Ribosome", font_size=24).next_to(ribosome, UP, buff=0.2)
        
        start_codon_pos = mrna_strand.get_center() + LEFT * 2.5
        ribosome.move_to(start_codon_pos + UP*2)
        self.play(FadeIn(ribosome, scale=0.5), Write(ribosome_label))
        self.play(ribosome.animate.move_to(start_codon_pos))
        
        start_codon_box = SurroundingRectangle(mrna_codons[0][10:13], buff=0.05, color=YELLOW)
        start_codon_label = Text("Start Codon", font_size=20).next_to(start_codon_box, DOWN)
        self.play(Create(start_codon_box), Write(start_codon_label))
        self.wait(1)

        polypeptide_chain = VGroup()
        polypeptide_label = Text("Polypeptide Chain", font_size=24).next_to(ribosome, UP, buff=1.0)
        self.play(Write(polypeptide_label))
        
        codon_positions = [start_codon_pos, start_codon_pos + RIGHT * 2, start_codon_pos + RIGHT * 4]
        amino_acid_data = [("UAC", TEAL), ("AGA", PINK), ("CCG", GOLD)]
        
        for i, (pos, (anti, color)) in enumerate(zip(codon_positions, amino_acid_data)):
            trna_group = self.create_trna(color, anti)
            trna_group.move_to(pos + UP * 3)
            self.play(FadeIn(trna_group, scale=0.8))
            self.play(trna_group.animate.move_to(pos + DOWN * 0.2))
            
            amino_acid = trna_group[0][1] # The circle part of the tRNA
            
            # Animate the chain growing out of the ribosome
            if polypeptide_chain:
                # Shift existing chain to make space
                self.play(polypeptide_chain.animate.shift(LEFT * 0.5))
            
            new_aa = amino_acid.copy()
            new_aa.move_to(polypeptide_label.get_center() + DOWN*0.7)
            
            if polypeptide_chain:
                bond = Line(polypeptide_chain[-1].get_center(), new_aa.get_center(), color=WHITE, stroke_width=3)
                polypeptide_chain.add(bond)
            
            polypeptide_chain.add(new_aa)
            
            if len(polypeptide_chain) > 1:
                self.play(ReplacementTransform(amino_acid.copy(), VGroup(new_aa, bond)))
            else:
                self.play(ReplacementTransform(amino_acid.copy(), new_aa))

            self.play(FadeOut(trna_group))
            if i < len(codon_positions) - 1:
                self.play(ribosome.animate.move_to(codon_positions[i+1]))
            if i == 0: self.play(FadeOut(start_codon_box, start_codon_label))

        stop_codon_pos = start_codon_pos + RIGHT * 6
        self.play(ribosome.animate.move_to(stop_codon_pos))

        stop_codon_box = SurroundingRectangle(mrna_codons[0][20:23], buff=0.05, color=ORANGE)
        stop_codon_label = Text("Stop Codon", font_size=20).next_to(stop_codon_box, DOWN)
        self.play(Create(stop_codon_box), Write(stop_codon_label))

        self.play(
            polypeptide_chain.animate.shift(UP * 2 + RIGHT * 2).scale(1.2),
            ribosome.animate.shift(DOWN * 2),
            FadeOut(ribosome_label, polypeptide_label)
        )
        self.play(FadeOut(ribosome), FadeOut(mrna_strand), FadeOut(mrna_codons), FadeOut(stop_codon_box), FadeOut(stop_codon_label))
        
        return VGroup(title, polypeptide_chain)

    def play_protein_folding(self, translation_objects):
        """STAGE 4: PROTEIN FOLDING"""
        title = translation_objects[0]
        polypeptide_chain = translation_objects[1]
        
        folding_title = Text("3. Protein Folding", font_size=40).to_edge(UP)
        self.play(ReplacementTransform(title, folding_title))
        self.play(polypeptide_chain.animate.center().scale(1.5))
        self.wait(1)
        
        final_protein_structure = ParametricFunction(
            lambda t: [1.5 * np.cos(3*t), 0.8*t + 0.2*np.sin(6*t), 0], t_range=[-1.5, 1.5],
        )

        amino_acids = VGroup(*[item for item in polypeptide_chain if isinstance(item, Circle)])
        bonds = VGroup(*[item for item in polypeptide_chain if isinstance(item, Line)])

        self.play(
            *[amino_acids[i].animate.move_to(final_protein_structure.point_from_proportion(i / (len(amino_acids)-1))) for i in range(len(amino_acids))],
            *[UpdateFromFunc(
                bonds[i],
                lambda b, i=i: b.put_start_and_end_on(
                    amino_acids[i].get_center(), amino_acids[i+1].get_center()
                )
            ) for i in range(len(bonds))],
            run_time=3
        )
        
        final_protein_label = Text("Functional Protein", font_size=36, color=YELLOW).next_to(polypeptide_chain, DOWN, buff=0.5)
        self.play(Write(final_protein_label))
        self.wait(2)
        
        self.play(FadeOut(polypeptide_chain, folding_title, final_protein_label))

    def create_trna(self, aa_color, anticodon_text):
        """Helper function to create a tRNA molecule visual."""
        body = VGroup(
            Arc(radius=0.5, start_angle=PI, angle=PI, color=BLUE),
            Line(LEFT*0.5, RIGHT*0.5, color=BLUE),
            Line(ORIGIN, UP*0.5, color=BLUE)
        ).arrange(DOWN, buff=0).scale(0.8)
        
        amino_acid = Circle(radius=0.2, color=aa_color, fill_opacity=1).next_to(body, UP, buff=0)
        anticodon = Text(anticodon_text, font_size=20).next_to(body, DOWN, buff=0.1)
        trna = VGroup(body, amino_acid, anticodon)
        
        trna_label = Text("tRNA", font_size=20).next_to(trna, RIGHT, buff=0.2)
        return VGroup(trna, trna_label)