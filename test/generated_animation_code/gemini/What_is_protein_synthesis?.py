from manim import *

class ProteinSynthesis(MovingCameraScene):
    def construct(self):
        self.camera.frame.scale(1.2)

        title = Text("What is Protein Synthesis?")
        self.play(self.camera.frame.animate.move_to(title))
        self.play(self.camera.frame.animate.scale(0.5))
        self.play(self.camera.frame.animate.move_to(title))
        self.wait(1)

        dna = Text("DNA", color="#DE3163")
        arrow1 = Arrow(dna.get_bottom(), dna.get_bottom() + DOWN * 1.5)
        rna = Text("RNA", color="#FFBF00")
        rna.next_to(arrow1, DOWN)
        arrow2 = Arrow(rna.get_bottom(), rna.get_bottom() + DOWN * 1.5)
        protein = Text("Protein", color="#7DF9FF")
        protein.next_to(arrow2, DOWN)

        process = VGroup(dna, arrow1, rna, arrow2, protein)
        process.move_to(ORIGIN)

        self.play(self.camera.frame.animate.move_to(process))
        self.play(self.camera.frame.animate.scale(1.5))
        self.play(self.camera.frame.animate.move_to(process))

        self.play(
            dna.animate.shift(UP*2),
            arrow1.animate.shift(UP*2),
            rna.animate.shift(UP*2),
            arrow2.animate.shift(UP*2),
            protein.animate.shift(UP*2)
        )

        transcription = Text("Transcription", color="#9FE2BF")
        transcription.next_to(arrow1, RIGHT)
        translation = Text("Translation", color="#40E0D0")
        translation.next_to(arrow2, RIGHT)

        self.play(self.camera.frame.animate.move_to(VGroup(transcription, translation)))
        self.play(self.camera.frame.animate.scale(0.75))
        self.play(self.camera.frame.animate.move_to(VGroup(transcription, translation)))

        self.play(
            dna.animate.shift(DOWN*2),
            arrow1.animate.shift(DOWN*2),
            rna.animate.shift(DOWN*2),
            arrow2.animate.shift(DOWN*2),
            protein.animate.shift(DOWN*2),
            transcription.animate.shift(DOWN*2),
            translation.animate.shift(DOWN*2)
        )

        self.wait(2)