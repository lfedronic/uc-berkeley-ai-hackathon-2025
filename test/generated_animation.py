from manim import (
    Scene, Ellipse, Text, Rectangle, Line, Create, Write, VGroup, 
    RoundedRectangle, FadeIn, FadeOut, Indicate, Flash, Circle, Dot,
    BackgroundRectangle, Arc, Triangle, UP, DOWN, LEFT, RIGHT, ORIGIN,
    PI, UL, DL, UR, DR, WHITE, GRAY, GRAY_A, GRAY_D, GRAY_E, RED, RED_A, 
    RED_B, ORANGE, YELLOW, YELLOW_A, GREEN, GREEN_A, BLUE, 
    BLUE_A, BLUE_E, PURPLE_A, PURPLE_C, TEAL, GOLD_A
)

MED_SMALL_FONT_SIZE = 20
SMALL_FONT_SIZE = 16
DESIRED_FONT_SIZE = 18

# Define missing color constants (Manim doesn't provide these by default)
RED_A = "#ffaaaa"
RED_B = "#ff5555"
ORANGE_A = "#ffd580"
PURPLE_A = "#b39ddb"
PURPLE_C = "#9575cd"
BLUE_A = "#82b1ff"
GOLD_A = "#ffd700"
GREEN_A = "#b9f6ca"
GRAY_E = "#cccccc"
class ProteinSynthesisAnimation(Scene):
    def construct(self):
        # --- Scene Setup - Initial State ---

        # 1. Environment Setup
        nucleus = Ellipse(width=5.0, height=4.0, color=BLUE_E, fill_opacity=0.2, stroke_opacity=1.0)
        nucleus_label = Text("Nucleus", font_size=MED_SMALL_FONT_SIZE).move_to(nucleus.get_center())
        cytoplasm_label = Text("Cytoplasm", font_size=MED_SMALL_FONT_SIZE).move_to(RIGHT * 3)

        # Nuclear Pore - represented by a slightly thicker line segment on the nucleus boundary
        nuclear_pore_center = nucleus.get_center() + LEFT * 2 + UP * 0.5
        nuclear_pore = Rectangle(width=0.2, height=0.8, color=GRAY, fill_opacity=1.0)
        nuclear_pore.move_to(nuclear_pore_center).align_to(nucleus, LEFT)

        self.play(
            Create(nucleus),
            Write(nucleus_label),
            Write(cytoplasm_label),
            Create(nuclear_pore)
        )
        self.wait(1)

        # 2. DNA Initial State (Inside Nucleus)
        dna_helix = VGroup()
        line_1 = Line(start=nuclear_pore_center + UP * 1.5, end=nuclear_pore_center + DOWN * 1.5, color=WHITE)
        line_2 = Line(start=nuclear_pore_center + UP * 1.5, end=nuclear_pore_center + DOWN * 1.5, color=WHITE)

        base_pairs_vgroup = VGroup()
        hydrogen_bond_lines_vgroup = VGroup()

        dna_bases_template = ["A", "T", "C", "G", "T", "A", "G", "C", "A", "T"]
        rna_bases_complement = ["U", "A", "G", "C", "A", "U", "C", "G", "U", "A"] # For mRNA synthesis

        base_colors = {
            "A": ORANGE, "T": RED, "C": BLUE, "G": GREEN, "U": RED_A
        }

        for i in range(10):
            # DNA Bases - Use interpolation along the line instead of get_point_at_angle
            proportion = i / 9.0  # 0 to 1
            dna_base_1_pos = line_1.point_from_proportion(proportion) + UP * (i * 0.3 - 1.35)
            dna_base_2_pos = line_2.point_from_proportion(proportion) + DOWN * (i * 0.3 - 1.35)

            dna_base_1 = Rectangle(width=0.2, height=0.4, color=base_colors[dna_bases_template[i]], fill_opacity=1.0)
            dna_base_1.move_to(dna_base_1_pos)
            dna_base_2 = Rectangle(width=0.2, height=0.4, color=base_colors[dna_bases_template[i]], fill_opacity=1.0)
            dna_base_2.move_to(dna_base_2_pos)

            # Connect bases to backbone
            connection_1 = Line(line_1.point_from_proportion(proportion), dna_base_1.get_center(), color=WHITE)
            connection_2 = Line(line_2.point_from_proportion(proportion), dna_base_2.get_center(), color=WHITE)

            # Hydrogen bonds
            hydrogen_bond = Line(dna_base_1.get_right(), dna_base_2.get_left(), color=GRAY_A, stroke_width=2)

            dna_base_pair = VGroup(dna_base_1, dna_base_2)
            base_pairs_vgroup.add(dna_base_pair)
            hydrogen_bond_lines_vgroup.add(hydrogen_bond)

            dna_helix.add(dna_base_1, dna_base_2, connection_1, connection_2)

        # Adjust backbone lines to connect correctly to bases
        # Get the corners of all base pairs to determine line endpoints
        base_corners_ul = [base.get_corner(UL) for base in base_pairs_vgroup]
        base_corners_dl = [base.get_corner(DL) for base in base_pairs_vgroup]
        base_corners_ur = [base.get_corner(UR) for base in base_pairs_vgroup]
        base_corners_dr = [base.get_corner(DR) for base in base_pairs_vgroup]
        
        # Create new lines with proper start and end points
        line_1 = Line(start=min(base_corners_ul, key=lambda p: p[1]), end=max(base_corners_dl, key=lambda p: p[1]), color=WHITE)
        line_2 = Line(start=min(base_corners_ur, key=lambda p: p[1]), end=max(base_corners_dr, key=lambda p: p[1]), color=WHITE)

        dna_helix.add(line_1, line_2, hydrogen_bond_lines_vgroup)
        dna_label = Text("DNA", font_size=MED_SMALL_FONT_SIZE).next_to(dna_helix, UP, buff=0.2)

        # Separate strands for unwinding
        dna_strand_1 = VGroup(*[m for m in dna_helix if m in [line_1] or m.get_center()[1] > line_1.get_center()[1]])
        dna_strand_2 = VGroup(*[m for m in dna_helix if m in [line_2] or m.get_center()[1] < line_2.get_center()[1]])
        
        dna_helix_parts = VGroup(line_1, line_2, hydrogen_bond_lines_vgroup, base_pairs_vgroup)
        dna_helix.add(dna_helix_parts)

        self.play(Create(dna_helix), Write(dna_label))
        self.wait(1)

        # --- Part 1: Transcription - Inside the Nucleus ---

        # 1. DNA Unwinding
        rna_polymerase = VGroup(
            RoundedRectangle(width=0.8, height=0.6, corner_radius=0.1, color=PURPLE_A),
            RoundedRectangle(width=0.7, height=0.5, corner_radius=0.1, color=PURPLE_A)
        )
        rna_polymerase[1].move_to(rna_polymerase[0].get_center() + RIGHT * 0.1)
        rna_polymerase_label = Text("RNA Pol.", font_size=SMALL_FONT_SIZE).next_to(rna_polymerase, DOWN, buff=0.1)

        self.play(
            FadeIn(rna_polymerase),
            rna_polymerase.animate.move_to(dna_helix.get_left() + LEFT * 1.5),
            Write(rna_polymerase_label)
        )
        self.wait(0.5)

        # Indicate template strand
        template_strand_segment = VGroup(*[m for m in dna_helix if m in [line_1] or m.get_center()[1] > line_1.get_center()[1]])
        self.play(Indicate(template_strand_segment, color=YELLOW_A))
        self.wait(0.5)

        self.play(
            FadeOut(hydrogen_bond_lines_vgroup),
            dna_strand_1.animate.shift(UP * 0.3).set_color(GRAY), # Make template strand fainter
            dna_strand_2.animate.shift(DOWN * 0.3).set_color(GRAY), # Make non-template strand fainter
            run_time=1.5
        )
        self.wait(0.5)

        # 2. mRNA Synthesis (Elongation)
        mrna_strand_vgroup = VGroup()
        mrna_label = Text("mRNA", font_size=SMALL_FONT_SIZE).next_to(mrna_strand_vgroup, DOWN, buff=0.1)

        for i in range(8):
            # Simulate RNA Polymerase movement
            self.play(rna_polymerase.animate.shift(RIGHT * 0.5))

            # Get corresponding DNA template base - ensure proportion stays between 0 and 1
            proportion = min(0.9, 0.1 + (i * 0.1))  # Start at 0.1, increment by 0.1, cap at 0.9
            dna_template_base_pos = line_1.point_from_proportion(proportion)
            dna_template_base_center = dna_template_base_pos

            # Get DNA template base text (assuming we can identify it visually)
            # This is a simplification; in a real scenario, we'd track the specific base object
            # For demonstration, we'll use the pre-defined sequence.
            dna_template_base_char = dna_bases_template[i]
            rna_complement_char = rna_bases_complement[i]
            
            # Create new RNA base
            new_rna_base = Rectangle(width=0.2, height=0.4, color=base_colors[rna_complement_char], fill_opacity=1.0)
            new_rna_base.move_to(dna_template_base_center + DOWN * 0.7) # Position relative to DNA

            self.play(Create(new_rna_base))
            self.play(Flash(new_rna_base, color=YELLOW)) # Simulate pairing

            # Add RNA base to mRNA strand
            mrna_strand_vgroup.add(new_rna_base)
            mrna_strand_vgroup.add(Line(new_rna_base.get_bottom(), dna_template_base_center + DOWN * 0.3, color=WHITE)) # Connect to DNA

            # Position the new RNA base correctly in the emerging mRNA strand
            new_rna_base.next_to(mrna_strand_vgroup.submobjects[-2] if len(mrna_strand_vgroup) > 2 else rna_polymerase, RIGHT, buff=0.1)
            if len(mrna_strand_vgroup) > 2:
                 mrna_strand_vgroup[-2].move_to(rna_polymerase.get_center() + RIGHT*(i*0.5 + 0.25) + DOWN*0.7)
            else:
                 new_rna_base.move_to(rna_polymerase.get_center() + RIGHT*0.75 + DOWN*0.7)

            mrna_strand_vgroup.add(new_rna_base)


            # Visual positioning adjustment for mRNA strand growth
            current_mrna_elements = mrna_strand_vgroup.submobjects[-2:] # last base and its connection
            if len(mrna_strand_vgroup) > 2:
                prev_mrna_base = mrna_strand_vgroup[-3]
                prev_mrna_connection = mrna_strand_vgroup[-2]
                
                current_mrna_base = current_mrna_elements[0]
                current_mrna_connection = current_mrna_elements[1]
                
                current_mrna_base.next_to(prev_mrna_base, RIGHT, buff=0.1)
                # Create new connection line with proper start and end points
                current_mrna_connection = Line(start=current_mrna_base.get_bottom(), end=dna_template_base_center + DOWN * 0.3, color=WHITE)
                
            else: # First base
                current_mrna_base = current_mrna_elements[0]
                current_mrna_connection = current_mrna_elements[1]
                
                current_mrna_base.move_to(rna_polymerase.get_center() + RIGHT * 0.75 + DOWN * 0.7)
                # Create new connection line with proper start and end points
                current_mrna_connection = Line(start=current_mrna_base.get_bottom(), end=dna_template_base_center + DOWN * 0.3, color=WHITE)

            mrna_strand_vgroup.add(current_mrna_base, current_mrna_connection)


        self.play(Write(mrna_label.next_to(mrna_strand_vgroup, DOWN)))
        self.wait(1)

        # 3. mRNA Processing (Post-Transcription)
        self.play(FadeOut(rna_polymerase), FadeOut(rna_polymerase_label))
        self.play(FadeOut(mrna_label)) # Remove temporary mRNA label

        # 5' Cap
        cap_5 = Circle(radius=0.15, color=YELLOW, fill_opacity=1.0)
        cap_5_label = Text("5'", font_size=SMALL_FONT_SIZE).next_to(cap_5, UP)
        cap_group = VGroup(cap_5, cap_5_label)
        
        mrna_first_base = mrna_strand_vgroup[0] if mrna_strand_vgroup else None
        if mrna_first_base:
            cap_5.move_to(mrna_first_base.get_left() + LEFT * 0.3)
            cap_5_label.next_to(cap_5, UP)
            self.play(Create(cap_5), Write(cap_5_label))
            self.wait(0.5)
            
        # Poly-A Tail
        poly_a_tail_vgroup = VGroup()
        poly_a_tail_label = Text("Poly-A Tail", font_size=SMALL_FONT_SIZE)
        for i in range(5):
            dot = Dot(radius=0.05, color=GRAY_A)
            dot.move_to(mrna_strand_vgroup[-2].get_right() + RIGHT * (i * 0.2 + 0.2)) # Position after last base
            poly_a_tail_vgroup.add(dot)
        poly_a_tail_label.next_to(poly_a_tail_vgroup, DOWN)

        self.play(Create(poly_a_tail_vgroup), Write(poly_a_tail_label))
        self.wait(0.5)

        # Splicing (Intron Removal) - Assuming bases 3-5 are introns
        if len(mrna_strand_vgroup) >= 6:
            # Use list unpacking to avoid type issues
            intron_bases = [mrna_strand_vgroup[4], mrna_strand_vgroup[5], mrna_strand_vgroup[6]]
            intron_segment = VGroup(*intron_bases)
            intron_label = Text("Intron", font_size=DESIRED_FONT_SIZE).move_to(intron_segment.get_center())
            
            exon_bases_1 = [mrna_strand_vgroup[0], mrna_strand_vgroup[1], mrna_strand_vgroup[2]]
            exon_bases_2 = [mrna_strand_vgroup[7], mrna_strand_vgroup[8]]
            exon_segment_1 = VGroup(*exon_bases_1)
            exon_segment_2 = VGroup(*exon_bases_2)
            
            exon_segment_1.set_color(GREEN_A)
            exon_segment_2.set_color(GREEN_A)
            intron_segment.set_color(RED_A)
            
            self.play(intron_segment.animate.shift(DOWN * 0.5).scale(0.5), Write(intron_label), run_time=1)
            self.play(FadeOut(intron_segment), FadeOut(intron_label))
            
            # Join exons
            self.play(
                exon_segment_2.animate.next_to(exon_segment_1, RIGHT, buff=0.1),
                FadeOut(poly_a_tail_vgroup), FadeOut(poly_a_tail_label),
                FadeOut(cap_5_label),
                run_time=1.5
            )
            
            # Reconstruct mature mRNA without introns and tail/cap labels
            mature_mrna_vgroup = VGroup(exon_segment_1, exon_segment_2, cap_5)
            mature_mrna_vgroup.add(*[m for m in mrna_strand_vgroup if m not in intron_segment]) # Include remaining bases

        else: # If mRNA is too short for splicing, just create mature mRNA
            mature_mrna_vgroup = VGroup(mrna_strand_vgroup, cap_5)
            self.play(FadeOut(poly_a_tail_vgroup), FadeOut(poly_a_tail_label), FadeOut(cap_5_label))

        mature_mrna_label = Text("Mature mRNA", font_size=MED_SMALL_FONT_SIZE).next_to(mature_mrna_vgroup, DOWN)
        self.play(Write(mature_mrna_label))
        self.wait(1)

        # 4. mRNA Exit
        self.play(
            mature_mrna_vgroup.animate.move_to(nuclear_pore.get_center()),
            run_time=1.5
        )
        self.play(
            mature_mrna_vgroup.animate.shift(RIGHT * 3),
            run_time=1.5
        )
        self.wait(1)
        self.play(FadeOut(nucleus), FadeOut(nucleus_label), FadeOut(dna_helix), FadeOut(dna_label))
        self.play(FadeOut(nuclear_pore))

        # --- Part 2: Translation - In the Cytoplasm ---

        # 1. Ribosome Assembly
        small_ribosomal_subunit = RoundedRectangle(width=2.0, height=0.8, corner_radius=0.2, color=GRAY_D)
        small_ribosomal_subunit_label = Text("Small Subunit", font_size=SMALL_FONT_SIZE).next_to(small_ribosomal_subunit, DOWN)

        large_ribosomal_subunit = RoundedRectangle(width=2.5, height=1.2, corner_radius=0.2, color=GRAY_E)
        large_ribosomal_subunit_label = Text("Large Subunit", font_size=SMALL_FONT_SIZE).next_to(large_ribosomal_subunit, DOWN)

        ribosome_center = ORIGIN + RIGHT * 2
        small_ribosomal_subunit.move_to(ribosome_center + DOWN * 0.5)
        large_ribosomal_subunit.move_to(ribosome_center + UP * 0.5)

        # mRNA position relative to ribosome
        mature_mrna_vgroup.move_to(small_ribosomal_subunit.get_center() + DOWN * 0.4)
        mature_mrna_vgroup.align_to(small_ribosomal_subunit, UP)

        # Sites within Large Subunit
        a_site_rect = Rectangle(width=0.7, height=0.5, color=WHITE, fill_opacity=0.1).move_to(large_ribosomal_subunit.get_center() + RIGHT * 0.6 + UP * 0.1)
        p_site_rect = Rectangle(width=0.7, height=0.5, color=WHITE, fill_opacity=0.1).move_to(large_ribosomal_subunit.get_center())
        e_site_rect = Rectangle(width=0.7, height=0.5, color=WHITE, fill_opacity=0.1).move_to(large_ribosomal_subunit.get_center() + LEFT * 0.6 + UP * 0.1)
        
        a_site_label = Text("A", font_size=SMALL_FONT_SIZE).move_to(a_site_rect.get_center())
        p_site_label = Text("P", font_size=SMALL_FONT_SIZE).move_to(p_site_rect.get_center())
        e_site_label = Text("E", font_size=SMALL_FONT_SIZE).move_to(e_site_rect.get_center())

        ribosome_vgroup = VGroup(small_ribosomal_subunit, large_ribosomal_subunit, a_site_rect, p_site_rect, e_site_rect)

        self.play(FadeIn(small_ribosomal_subunit), Write(small_ribosomal_subunit_label))
        self.play(mature_mrna_vgroup.animate.next_to(small_ribosomal_subunit, DOWN, buff=0.2))
        self.play(FadeIn(large_ribosomal_subunit), Write(large_ribosomal_subunit_label))
        self.play(
            Create(a_site_rect), Create(p_site_rect), Create(e_site_rect),
            Write(a_site_label), Write(p_site_label), Write(e_site_label)
        )
        self.wait(1)

        # Highlight start codon (AUG)
        start_codon_group = VGroup(*mature_mrna_vgroup[0:3])
        start_codon_highlight = BackgroundRectangle(start_codon_group, color=YELLOW, fill_opacity=0.3)
        self.play(Create(start_codon_highlight))

        # 2. Initiation (First tRNA)
        # tRNA for Met (anticodon UAC)
        tRNA_met = VGroup()
        tRNA_met.add(Arc(start_angle=PI/2, angle=PI, radius=0.5, color=TEAL)) # Top loop
        tRNA_met.add(Line(tRNA_met[0].get_right(), tRNA_met[0].get_right() + DOWN*0.2, color=TEAL)) # Right stem
        tRNA_met.add(Arc(start_angle=3*PI/2, angle=PI, radius=0.3, color=TEAL).flip(RIGHT)) # Bottom loop
        tRNA_met.add(Line(tRNA_met[0].get_left(), tRNA_met[0].get_left() + DOWN*0.2, color=TEAL)) # Left stem
        tRNA_met.add(Line(tRNA_met[0].get_center() + UP*0.5, tRNA_met[0].get_center() + UP*0.7, color=TEAL)) # Amino acid arm stem
        
        met_aa = Text("Met", font_size=SMALL_FONT_SIZE, color=YELLOW_A).move_to(tRNA_met[0].get_center() + UP * 0.6)
        anticodon_uac = Text("UAC", font_size=SMALL_FONT_SIZE).move_to(tRNA_met[2].get_center())
        tRNA_met.add(met_aa, anticodon_uac)

        tRNA_met.move_to(p_site_rect.get_center() + UP * 0.5)

        self.play(Create(tRNA_met))
        self.play(
            tRNA_met.animate.move_to(p_site_rect.get_center() + UP * 0.5),
            Flash(anticodon_uac, color=YELLOW),
            Flash(start_codon_highlight, color=YELLOW),
            run_time=1.5
        )
        self.wait(1)

        # 3. Elongation (Cycle 1)
        # Next codon (GGU)
        codon_width = mature_mrna_vgroup.get_width() / 3 # Approximate width per codon
        next_codon_group = VGroup(*mature_mrna_vgroup[3:6])
        next_codon_highlight = BackgroundRectangle(next_codon_group, color=YELLOW, fill_opacity=0.3)
        self.play(Create(next_codon_highlight))

        # Incoming tRNA for Gly (anticodon CCA)
        tRNA_gly = VGroup()
        tRNA_gly.add(Arc(start_angle=PI/2, angle=PI, radius=0.5, color=PURPLE_C))
        tRNA_gly.add(Line(tRNA_gly[0].get_right(), tRNA_gly[0].get_right() + DOWN*0.2, color=PURPLE_C))
        tRNA_gly.add(Arc(start_angle=3*PI/2, angle=PI, radius=0.3, color=PURPLE_C).flip(RIGHT))
        tRNA_gly.add(Line(tRNA_gly[0].get_left(), tRNA_gly[0].get_left() + DOWN*0.2, color=PURPLE_C))
        tRNA_gly.add(Line(tRNA_gly[0].get_center() + UP*0.5, tRNA_gly[0].get_center() + UP*0.7, color=PURPLE_C))
        gly_aa = Text("Gly", font_size=SMALL_FONT_SIZE, color=ORANGE_A).move_to(tRNA_gly[0].get_center() + UP * 0.6)
        anticodon_cca = Text("CCA", font_size=SMALL_FONT_SIZE).move_to(tRNA_gly[2].get_center())
        tRNA_gly.add(gly_aa, anticodon_cca)

        tRNA_gly.move_to(a_site_rect.get_center() + UP * 0.5)

        self.play(Create(tRNA_gly))
        self.play(
            tRNA_gly.animate.move_to(a_site_rect.get_center() + UP * 0.5),
            Flash(anticodon_cca, color=YELLOW),
            Flash(next_codon_highlight, color=YELLOW),
            run_time=1.5
        )
        self.wait(0.5)

        # Peptide Bond Formation
        met_aa_obj = met_aa # Keep reference to Met text
        gly_aa_obj = gly_aa # Keep reference to Gly text

        peptide_bond_line = Line(met_aa_obj.get_bottom(), gly_aa_obj.get_corner(UP), color=WHITE)
        
        self.play(met_aa_obj.animate.next_to(gly_aa_obj, UP, buff=0.1))
        self.play(Create(peptide_bond_line))

        # Polypeptide chain grows
        polypeptide_chain_vgroup = VGroup(gly_aa_obj, peptide_bond_line)
        polypeptide_chain_label = Text("Polypeptide", font_size=SMALL_FONT_SIZE).next_to(polypeptide_chain_vgroup, DOWN)
        self.play(Write(polypeptide_chain_label))
        self.wait(0.5)

        # Translocation
        self.play(
            FadeOut(start_codon_highlight), # Remove old highlight
            FadeOut(next_codon_highlight), # Remove old highlight
            FadeOut(small_ribosomal_subunit_label), FadeOut(large_ribosomal_subunit_label), # Temporarily hide labels for clarity
            FadeOut(p_site_label), FadeOut(a_site_label), FadeOut(e_site_label), # Hide site labels
            run_time=0.5
        )
        
        empty_tRNA_met = VGroup(tRNA_met.copy(), met_aa_obj.copy(), anticodon_uac.copy()) # Create detached tRNA Met
        empty_tRNA_met.set_color(GRAY) # Make it look empty/detached
        
        self.play(
            ribosome_vgroup.animate.shift(LEFT * codon_width),
            mature_mrna_vgroup.animate.shift(LEFT * codon_width),
            tRNA_gly.animate.move_to(p_site_rect.get_center() + UP * 0.5), # tRNA_gly moves to P site
            empty_tRNA_met.animate.move_to(e_site_rect.get_center() + UP * 0.5), # Old tRNA moves to E site
            run_time=2
        )

        self.play(FadeOut(empty_tRNA_met)) # tRNA detaches from E site
        self.play(
            Create(p_site_rect), Create(a_site_rect), Create(e_site_rect), # Re-create site rectangles for clarity
            Write(p_site_label), Write(a_site_label), Write(e_site_label)
        )
        self.wait(0.5)
        
        # Elongation Cycle 2
        # Next codon (e.g., CUA)
        next_codon_group = VGroup(*mature_mrna_vgroup[6:9])
        next_codon_highlight = BackgroundRectangle(next_codon_group, color=YELLOW, fill_opacity=0.3)
        self.play(Create(next_codon_highlight))

        # Incoming tRNA for Leu (anticodon GAU)
        tRNA_leu = VGroup()
        tRNA_leu.add(Arc(start_angle=PI/2, angle=PI, radius=0.5, color=RED_B))
        tRNA_leu.add(Line(tRNA_leu[0].get_right(), tRNA_leu[0].get_right() + DOWN*0.2, color=RED_B))
        tRNA_leu.add(Arc(start_angle=3*PI/2, angle=PI, radius=0.3, color=RED_B).flip(RIGHT))
        tRNA_leu.add(Line(tRNA_leu[0].get_left(), tRNA_leu[0].get_left() + DOWN*0.2, color=RED_B))
        tRNA_leu.add(Line(tRNA_leu[0].get_center() + UP*0.5, tRNA_leu[0].get_center() + UP*0.7, color=RED_B))
        leu_aa = Text("Leu", font_size=SMALL_FONT_SIZE, color=BLUE_A).move_to(tRNA_leu[0].get_center() + UP * 0.6)
        anticodon_gau = Text("GAU", font_size=SMALL_FONT_SIZE).move_to(tRNA_leu[2].get_center())
        tRNA_leu.add(leu_aa, anticodon_gau)

        tRNA_leu.move_to(a_site_rect.get_center() + UP * 0.5)

        self.play(Create(tRNA_leu))
        self.play(
            tRNA_leu.animate.move_to(a_site_rect.get_center() + UP * 0.5),
            Flash(anticodon_gau, color=YELLOW),
            Flash(next_codon_highlight, color=YELLOW),
            run_time=1.5
        )
        self.wait(0.5)

        # Peptide Bond Formation
        current_polypeptide = polypeptide_chain_vgroup # Previous chain
        gly_aa_obj_in_p_site = current_polypeptide[0] # Glycine in P site
        
        peptide_bond_line_2 = Line(gly_aa_obj_in_p_site.get_bottom(), leu_aa.get_corner(UP), color=WHITE)

        self.play(gly_aa_obj_in_p_site.animate.next_to(leu_aa, UP, buff=0.1))
        self.play(Create(peptide_bond_line_2))
        
        polypeptide_chain_vgroup = VGroup(leu_aa, peptide_bond_line_2, gly_aa_obj_in_p_site) # Update chain VGroup

        # Translocation
        empty_tRNA_gly = VGroup(tRNA_gly.copy(), gly_aa_obj_in_p_site.copy(), anticodon_cca.copy())
        empty_tRNA_gly.set_color(GRAY)
        
        self.play(
            FadeOut(next_codon_highlight), # Remove highlight
            ribosome_vgroup.animate.shift(LEFT * codon_width),
            mature_mrna_vgroup.animate.shift(LEFT * codon_width),
            tRNA_leu.animate.move_to(p_site_rect.get_center() + UP * 0.5),
            empty_tRNA_gly.animate.move_to(e_site_rect.get_center() + UP * 0.5),
            run_time=2
        )
        self.play(FadeOut(empty_tRNA_gly))
        self.wait(0.5)

        # 4. Termination
        # Stop codon (UAA)
        stop_codon_group = VGroup(*mature_mrna_vgroup[9:12]) # Assuming remaining bases are stop codon
        stop_codon_highlight = BackgroundRectangle(stop_codon_group, color=RED, fill_opacity=0.4)
        self.play(Create(stop_codon_highlight))

        # Release Factor
        release_factor = Triangle(fill_opacity=1.0, color=RED_B).scale(0.3)
        release_factor_label = Text("Release Factor", font_size=SMALL_FONT_SIZE).next_to(release_factor, DOWN)
        release_factor.move_to(a_site_rect.get_center() + UP * 0.5)
        
        self.play(Create(release_factor), Write(release_factor_label))
        self.play(release_factor.animate.move_to(a_site_rect.get_center() + UP * 0.5), run_time=1.5)
        self.wait(0.5)

        # Polypeptide detachment
        final_polypeptide = polypeptide_chain_vgroup # The complete chain
        self.play(
            final_polypeptide.animate.shift(UP * 2 + RIGHT * 3),
            run_time=1.5
        )
        self.wait(0.5)

        # Ribosome disassembly
        self.play(
            small_ribosomal_subunit.animate.shift(LEFT * 1.5),
            large_ribosomal_subunit.animate.shift(RIGHT * 1.5),
            FadeOut(release_factor), FadeOut(release_factor_label),
            FadeOut(stop_codon_highlight),
            FadeOut(mature_mrna_vgroup),
            run_time=2
        )
        self.play(FadeOut(small_ribosomal_subunit), FadeOut(large_ribosomal_subunit))
        self.wait(1)

        # 5. Polypeptide Folding
        folded_protein_shape = Ellipse(width=1.5, height=1.0, color=GOLD_A, fill_opacity=1.0)
        folded_protein_shape.move_to(final_polypeptide.get_center())
        folded_protein_label = Text("Folded Protein", font_size=MED_SMALL_FONT_SIZE).next_to(folded_protein_shape, DOWN)

        self.play(
            FadeOut(final_polypeptide),
            run_time=1
        )
        self.play(
            FadeIn(folded_protein_shape),
            run_time=1
        )
        self.play(Write(folded_protein_label))
        self.wait(2)
