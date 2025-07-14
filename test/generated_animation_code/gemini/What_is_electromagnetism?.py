from manim import *

class Electromagnetism(MovingCameraScene):
    def construct(self):
        self.camera.frame.scale(1.2)

        title = Text("What is Electromagnetism?", color=YELLOW)
        self.play(self.camera.frame.animate.move_to(ORIGIN))
        self.play(Create(title))
        self.wait(1)

        elec_text = Text("Electricity", color=BLUE).scale(0.8)
        mag_text = Text("Magnetism", color=RED).scale(0.8)

        elec_text.move_to(UP)
        mag_text.next_to(elec_text, DOWN)

        self.play(Create(elec_text))
        self.play(Create(mag_text))
        self.wait(1)

        arrow = Arrow(start=elec_text.get_edge(DOWN), end=mag_text.get_edge(UP), color=WHITE)
        self.play(Create(arrow))
        self.wait(1)

        relation_text = Text("Intertwined!", color=GREEN).scale(0.7)
        relation_text.next_to(arrow, RIGHT)
        self.play(Create(relation_text))
        self.wait(1)

        # Electric Field
        electric_charge = Dot(color=BLUE)
        electric_field_line1 = Line(start=electric_charge.get_center() + LEFT*2, end=electric_charge.get_center() + RIGHT*2, color=BLUE)
        electric_field_line2 = Line(start=electric_charge.get_center() + UP*2, end=electric_charge.get_center() + DOWN*2, color=BLUE)

        electric_group = VGroup(electric_charge, electric_field_line1, electric_field_line2)
        electric_group.move_to(LEFT*3)
        self.play(Fade_out(title, elec_text, mag_text, arrow, relation_text))
        self.play(self.camera.frame.animate.move_to(electric_group.get_center()))
        self.play(Create(electric_group))
        self.wait(1)

        # Magnetic Field
        magnet = Rectangle(width=1, height=2, color=RED)
        north_pole = Text("N", color=WHITE).scale(0.5).move_to(magnet.get_center() + UP*0.5)
        south_pole = Text("S", color=WHITE).scale(0.5).move_to(magnet.get_center() + DOWN*0.5)
        magnet_group = VGroup(magnet, north_pole, south_pole)

        magnetic_field_line1 = Circle(radius=0.5, color=RED).move_to(magnet_group.get_center()).shift(UP*0.5)
        magnetic_field_line2 = Circle(radius=0.5, color=RED).move_to(magnet_group.get_center()).shift(DOWN*0.5)
        magnetic_group = VGroup(magnet_group, magnetic_field_line1, magnetic_field_line2)
        magnetic_group.move_to(RIGHT*3)
        self.play(self.camera.frame.animate.move_to(magnetic_group.get_center()))
        self.play(Create(magnetic_group))
        self.wait(1)

        # Combined
        self.play(self.camera.frame.animate.move_to(ORIGIN))
        self.play(electric_group.animate.move_to(LEFT*3), magnetic_group.animate.move_to(RIGHT*3))
        self.wait(1)

        em_text = Text("Electromagnetism: Unified Force", color=YELLOW).scale(0.8)
        em_text.move_to(ORIGIN + DOWN*2)
        self.play(Create(em_text))
        self.wait(2)