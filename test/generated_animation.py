from manim import *

class XYPlaneExplanation(MovingCameraScene):
    def construct(self):
        # Overall Scene Setup
        # self.camera.frame.scale(1.2)  # This line causes the error - removing it
        self.camera.frame.scale(1.2)
        # Phase 1: Introducing the X-Y Plane

        # 1. Scene Start & Title
        title_text = Text("The Cartesian Coordinate Plane", font_size=48).to_edge(UP)
        self.play(FadeIn(title_text))
        self.wait(1)

        # 2. Drawing Axes
        axes_object = Axes(
            x_range=[-5, 5, 1],
            y_range=[-4, 4, 1],
            x_length=10,
            y_length=8,
            axis_config={"include_numbers": False, "font_size": 24, "color": LIGHT_GRAY},
            tips=True
        )
        self.play(Create(axes_object))
        self.wait(0.5)

        # 3. Labeling Axes
        x_axis_label = Text("X", font_size=36).next_to(axes_object.get_x_axis(), RIGHT, buff=0.3)
        y_axis_label = Text("Y", font_size=36).next_to(axes_object.get_y_axis(), UP, buff=0.3)
        self.play(FadeIn(x_axis_label, y_axis_label))
        self.wait(0.5)

        # 4. Highlighting the Origin
        origin_dot = Dot(axes_object.get_origin(), color=RED, radius=0.1)
        origin_label = Text("Origin (0,0)", font_size=24).next_to(origin_dot, DR, buff=0.2)
        self.play(Indicate(origin_dot, scale_factor=1.5, color=RED))
        self.play(FadeIn(origin_label))
        self.wait(1.5)
        self.play(FadeOut(origin_dot, origin_label))

        # 5. Explaining X and Y Directions
        x_direction_text = Text("X-axis: Horizontal (left/right)", font_size=28).to_corner(UL).shift(DOWN*1.5)
        x_positive_arrow = Arrow(axes_object.get_origin(), axes_object.c2p(3, 0), buff=0.1, color=WHITE)
        x_negative_arrow = Arrow(axes_object.get_origin(), axes_object.c2p(-3, 0), buff=0.1, color=WHITE)
        self.play(FadeIn(x_direction_text), Create(x_positive_arrow), Create(x_negative_arrow))
        self.wait(1.5)
        self.play(FadeOut(x_direction_text, x_positive_arrow, x_negative_arrow))

        y_direction_text = Text("Y-axis: Vertical (up/down)", font_size=28).to_corner(UR).shift(DOWN*1.5)
        y_positive_arrow = Arrow(axes_object.get_origin(), axes_object.c2p(0, 2), buff=0.1, color=WHITE)
        y_negative_arrow = Arrow(axes_object.get_origin(), axes_object.c2p(0, -2), buff=0.1, color=WHITE)
        self.play(FadeIn(y_direction_text), Create(y_positive_arrow), Create(y_negative_arrow))
        self.wait(1.5)
        self.play(FadeOut(y_direction_text, y_positive_arrow, y_negative_arrow))

        # 6. Introducing Quadrants (briefly)
        quadrant_I_label = Text("I", font_size=36).move_to(axes_object.c2p(3, 2))
        quadrant_II_label = Text("II", font_size=36).move_to(axes_object.c2p(-3, 2))
        quadrant_III_label = Text("III", font_size=36).move_to(axes_object.c2p(-3, -2))
        quadrant_IV_label = Text("IV", font_size=36).move_to(axes_object.c2p(3, -2))
        quadrant_labels_group = VGroup(quadrant_I_label, quadrant_II_label, quadrant_III_label, quadrant_IV_label)
        self.play(FadeIn(quadrant_labels_group))
        self.wait(2)
        self.play(FadeOut(quadrant_labels_group))

        # Phase 2: Understanding Coordinates (x,y)

        # 1. Defining a Coordinate Pair
        coordinate_pair_text = Text("(x, y)", font_size=72).move_to(ORIGIN).shift(UP*2)
        self.play(FadeIn(coordinate_pair_text))
        self.wait(1)

        # 2. Explaining 'x' component
        x_brace = Brace(coordinate_pair_text, DOWN, buff=0.3)
        x_explanation = Text("X-coordinate: horizontal distance from origin", font_size=24).next_to(x_brace, DOWN, buff=0.2)
        self.play(GrowFromCenter(x_brace), FadeIn(x_explanation))
        self.wait(2)
        self.play(FadeOut(x_brace, x_explanation))

        # 3. Explaining 'y' component
        y_brace = Brace(coordinate_pair_text, RIGHT, buff=0.3)
        y_explanation = Text("Y-coordinate: vertical distance from origin", font_size=24).next_to(y_brace, RIGHT, buff=0.2)
        self.play(GrowFromCenter(y_brace), FadeIn(y_explanation))
        self.wait(2)
        self.play(FadeOut(y_brace, y_explanation))
        self.play(FadeOut(coordinate_pair_text))

        # Phase 3: Hyper-Specific Plotting Example (Point A: (3, 2))

        # 1. Announce Point to Plot
        plot_instruction = Text("Let's plot the point (3, 2)", font_size=32).to_edge(UP)
        self.play(FadeIn(plot_instruction))
        self.wait(1)

        # 2. Focus on X-coordinate
        # self.play(Indicate(axes_object.get_x_axis().get_number_mobject(3), color=YELLOW))  # This won't work without numbers
        self.wait(0.5)
        step1_text = Text("1. Start at the origin (0,0).", font_size=28).next_to(plot_instruction, DOWN, aligned_edge=LEFT)
        self.play(FadeIn(step1_text))
        self.wait(1)

        self.play(FadeOut(step1_text))
        step2_text = Text("2. Move 3 units right along the X-axis (since 3 is positive).", font_size=28).next_to(plot_instruction, DOWN, aligned_edge=LEFT)
        self.play(FadeIn(step2_text))
        # Temporary dot at origin for animation
        temp_origin_dot = Dot(ORIGIN, color=WHITE, radius=0.05)
        self.add(temp_origin_dot)
        # Use regular Line instead of DashedLine to avoid coordinate issues
        x_line = Line(ORIGIN, RIGHT * 3, color=BLUE)
        # Animate the temporary dot moving along the path
        self.play(MoveAlongPath(temp_origin_dot, x_line), Create(x_line))
        self.wait(1)
        self.play(FadeOut(step2_text))

        # 3. Focus on Y-coordinate
        # self.play(Indicate(axes_object.get_y_axis().get_number_mobject(2), color=YELLOW))  # This won't work without numbers
        self.wait(0.5)
        step3_text = Text("3. From there, move 2 units UP, parallel to the Y-axis (since 2 is positive).", font_size=28).next_to(plot_instruction, DOWN, aligned_edge=LEFT)
        self.play(FadeIn(step3_text))
        # Use regular lines for the Y movement
        y_line_vertical = Line(RIGHT * 3, RIGHT * 3 + UP * 2, color=GREEN)
        y_line_horizontal = Line(UP * 2, RIGHT * 3 + UP * 2, color=GREEN)
        self.play(Create(y_line_vertical), Create(y_line_horizontal))
        self.wait(1)
        self.play(FadeOut(step3_text))

        # 4. Plotting the Point
        point_A_dot = Dot(RIGHT * 3 + UP * 2, color=ORANGE, radius=0.15)
        point_A_label = Text("A(3, 2)", font_size=28).next_to(point_A_dot, UP+RIGHT, buff=0.2)
        self.play(Create(point_A_dot))
        self.play(FadeIn(point_A_label))
        self.play(Flash(point_A_dot, flash_radius=0.3, line_length=0.1, num_lines=10, line_stroke_width=2, color=ORANGE))
        self.wait(1.5)
        self.play(FadeOut(plot_instruction, x_line, y_line_vertical, y_line_horizontal, temp_origin_dot))

        # Phase 4: Plotting More Examples (Points without full path animation)

        # 1. Point B: (-2, 1)
        point_B_dot = Dot(LEFT * 2 + UP * 1, color=BLUE, radius=0.15)
        point_B_label = Text("B(-2, 1)", font_size=28).next_to(point_B_dot, UP+LEFT, buff=0.2)
        self.play(Create(point_B_dot))
        self.play(FadeIn(point_B_label))
        self.play(Flash(point_B_dot, color=BLUE))
        self.wait(1)

        # 2. Point C: (1, -3)
        point_C_dot = Dot(RIGHT * 1 + DOWN * 3, color=PURPLE, radius=0.15)
        point_C_label = Text("C(1, -3)", font_size=28).next_to(point_C_dot, DOWN+RIGHT, buff=0.2)
        self.play(Create(point_C_dot))
        self.play(FadeIn(point_C_label))
        self.play(Flash(point_C_dot, color=PURPLE))
        self.wait(1)

        # 3. Point D: (-3.5, -2.5)
        point_D_dot = Dot(LEFT * 3.5 + DOWN * 2.5, color=PINK, radius=0.15)
        point_D_label = Text("D(-3.5, -2.5)", font_size=28).next_to(point_D_dot, DOWN+LEFT, buff=0.2)
        self.play(Create(point_D_dot))
        self.play(FadeIn(point_D_label))
        self.play(Flash(point_D_dot, color=PINK))
        self.wait(1)

        # Phase 5: Conclusion

        # 1. Summary Statement
        self.play(FadeOut(title_text, point_A_label, point_B_label, point_C_label, point_D_label))
        # Shrink and move axes to make space for text.
        self.play(
            axes_object.animate.scale(0.7).to_corner(UL).shift(RIGHT*0.5 + UP*0.5),
            x_axis_label.animate.scale(0.7).next_to(axes_object.get_x_axis(), RIGHT, buff=0.3),
            y_axis_label.animate.scale(0.7).next_to(axes_object.get_y_axis(), UP, buff=0.3)
        )
        summary_text = Text("Every point on the X-Y plane has a unique (x, y) address.").move_to(RIGHT * 2 + DOWN * 0.5).scale(0.8)
        self.play(FadeIn(summary_text))
        self.wait(3)

        # 2. Final Fade Out
        self.play(
            FadeOut(axes_object),
            FadeOut(summary_text),
            FadeOut(point_A_dot),
            FadeOut(point_B_dot),
            FadeOut(point_C_dot),
            FadeOut(point_D_dot),
            FadeOut(x_axis_label),
            FadeOut(y_axis_label)
        )
        self.wait(1)
