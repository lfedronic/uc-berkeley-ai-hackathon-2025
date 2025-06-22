
from manim import *

class XYPlaneGraphing(Scene):
    def construct(self):
        # 1. Scene Setup
        config.frame_width = 14
        config.frame_height = 8

        # 2. Introduction of the Plane
        # NumberPlane for the background grid
        number_plane = NumberPlane(
            x_range=[-6, 6, 1],
            y_range=[-4, 4, 1],
            x_length=12,
            y_length=8,
            background_line_style={"stroke_opacity": 0.3, "stroke_color": WHITE},
        )
        self.play(Create(number_plane))

        # Axes object for explicit X and Y axes
        axes = Axes(
            x_range=[-6, 6, 1],
            y_range=[-4, 4, 1],
            x_length=12,
            y_length=8,
            axis_config={"color": BLUE},
        )
        axes.add_coordinates()
        self.play(Create(axes))

        # Origin
        origin_dot = Dot(axes.coords_to_point(0, 0), color=RED)
        self.play(FadeIn(origin_dot))
        origin_label = Tex("(0, 0)").next_to(origin_dot, DOWN + LEFT, buff=0.1)
        self.play(Write(origin_label))

        # Axis Labels
        x_label = Tex("X-axis").next_to(axes.x_axis.get_end(), RIGHT, buff=0.1)
        y_label = Tex("Y-axis").next_to(axes.y_axis.get_end(), UP, buff=0.1)
        self.play(Write(x_label), Write(y_label))

        self.wait(1)

        # 3. Introduction of Quadrants
        quadrant1_text = Tex("Quadrant I").set_color(GREEN).shift(3.5 * RIGHT + 2 * UP)
        quadrant2_text = Tex("Quadrant II").set_color(YELLOW).shift(3.5 * LEFT + 2 * UP)
        quadrant3_text = Tex("Quadrant III").set_color(ORANGE).shift(3.5 * LEFT + 2 * DOWN)
        quadrant4_text = Tex("Quadrant IV").set_color(PURPLE).shift(3.5 * RIGHT + 2 * DOWN)

        self.play(FadeIn(quadrant1_text))
        self.wait(0.5)
        self.play(FadeIn(quadrant2_text))
        self.wait(0.5)
        self.play(FadeIn(quadrant3_text))
        self.wait(0.5)
        self.play(FadeIn(quadrant4_text))
        self.wait(1)

        quadrant_group = VGroup(quadrant1_text, quadrant2_text, quadrant3_text, quadrant4_text)
        self.play(FadeOut(quadrant_group))
        self.wait(0.5)

        # 4. Explaining Ordered Pairs
        understanding_text = Text("Understanding Ordered Pairs (x, y)", font_size=40).to_edge(UP)
        self.play(Write(understanding_text))
        self.wait(1.5)
        self.play(FadeOut(understanding_text))

        # 5. Graphing Specific Points (Detailed Step-by-Step for each)

        # Point 1: (3, 2)
        graphing_text = Tex("Graphing Point: (3, 2)").to_edge(UP).set_color(YELLOW)
        self.play(Write(graphing_text))
        self.play(Flash(axes.coords_to_point(0, 0), color=RED))
        moving_dot = Dot(axes.coords_to_point(0, 0), color=YELLOW)
        self.add(moving_dot)

        # Move horizontally for x = 3
        self.play(moving_dot.animate.move_to(axes.coords_to_point(3, 0)), run_time=1.5)
        x_line_1 = DashedLine(axes.coords_to_point(3, 0), axes.coords_to_point(3, 2), color=BLUE)
        self.play(Create(x_line_1))

        # Move vertically for y = 2
        self.play(moving_dot.animate.move_to(axes.coords_to_point(3, 2)), run_time=1.5)
        y_line_1 = DashedLine(axes.coords_to_point(0, 2), axes.coords_to_point(3, 2), color=GREEN)
        self.play(Create(y_line_1))

        final_dot_1 = Dot(axes.coords_to_point(3, 2), color=RED)
        self.play(FadeIn(final_dot_1))
        label_1 = Tex("(3, 2)").next_to(final_dot_1, UP + RIGHT, buff=0.1).set_color(RED)
        self.play(Write(label_1))

        self.remove(moving_dot)
        self.wait(1.5)
        self.play(FadeOut(graphing_text, x_line_1, y_line_1))

        # Point 2: (-4, 1)
        graphing_text = Tex("Graphing Point: (-4, 1)").to_edge(UP).set_color(YELLOW)
        self.play(Write(graphing_text))
        self.play(Flash(axes.coords_to_point(0, 0), color=RED))
        moving_dot = Dot(axes.coords_to_point(0, 0), color=YELLOW)
        self.add(moving_dot)

        # Move horizontally for x = -4
        self.play(moving_dot.animate.move_to(axes.coords_to_point(-4, 0)), run_time=1.5)
        x_line_2 = DashedLine(axes.coords_to_point(-4, 0), axes.coords_to_point(-4, 1), color=PURPLE)
        self.play(Create(x_line_2))

        # Move vertically for y = 1
        self.play(moving_dot.animate.move_to(axes.coords_to_point(-4, 1)), run_time=1.5)
        y_line_2 = DashedLine(axes.coords_to_point(0, 1), axes.coords_to_point(-4, 1), color=ORANGE)
        self.play(Create(y_line_2))

        final_dot_2 = Dot(axes.coords_to_point(-4, 1), color=RED)
        self.play(FadeIn(final_dot_2))
        label_2 = Tex("(-4, 1)").next_to(final_dot_2, UP + LEFT, buff=0.1).set_color(RED)
        self.play(Write(label_2))

        self.remove(moving_dot)
        self.wait(1.5)
        self.play(FadeOut(graphing_text, x_line_2, y_line_2))

        # Point 3: (0, -3)
        graphing_text = Tex("Graphing Point: (0, -3)").to_edge(UP).set_color(YELLOW)
        self.play(Write(graphing_text))
        self.play(Flash(axes.coords_to_point(0, 0), color=RED))
        moving_dot = Dot(axes.coords_to_point(0, 0), color=YELLOW)
        self.add(moving_dot)

        # Move horizontally for x = 0 (no movement)
        # Move vertically for y = -3
        x_line_3 = DashedLine(axes.coords_to_point(0, 0), axes.coords_to_point(0, -3), color=BLUE)
        self.play(Create(x_line_3))
        self.play(moving_dot.animate.move_to(axes.coords_to_point(0, -3)), run_time=1.5)

        final_dot_3 = Dot(axes.coords_to_point(0, -3), color=RED)
        self.play(FadeIn(final_dot_3))
        label_3 = Tex("(0, -3)").next_to(final_dot_3, DOWN, buff=0.1).set_color(RED)
        self.play(Write(label_3))

        self.remove(moving_dot)
        self.wait(1.5)
        self.play(FadeOut(graphing_text, x_line_3))

        # Point 4: (2, 0)
        graphing_text = Tex("Graphing Point: (2, 0)").to_edge(UP).set_color(YELLOW)
        self.play(Write(graphing_text))
        self.play(Flash(axes.coords_to_point(0, 0), color=RED))
        moving_dot = Dot(axes.coords_to_point(0, 0), color=YELLOW)
        self.add(moving_dot)

        # Move horizontally for x = 2
        x_line_4 = DashedLine(axes.coords_to_point(0, 0), axes.coords_to_point(2, 0), color=GREEN)
        self.play(Create(x_line_4))
        self.play(moving_dot.animate.move_to(axes.coords_to_point(2, 0)), run_time=1.5)

        # Move vertically for y = 0 (no movement)

        final_dot_4 = Dot(axes.coords_to_point(2, 0), color=RED)
        self.play(FadeIn(final_dot_4))
        label_4 = Tex("(2, 0)").next_to(final_dot_4, RIGHT, buff=0.1).set_color(RED)
        self.play(Write(label_4))

        self.remove(moving_dot)
        self.wait(1.5)
        self.play(FadeOut(graphing_text, x_line_4))

        # Point 5: (-2.5, -2.5)
        graphing_text = Tex("Graphing Point: (-2.5, -2.5)").to_edge(UP).set_color(YELLOW)
        self.play(Write(graphing_text))
        self.play(Flash(axes.coords_to_point(0, 0), color=RED))
        moving_dot = Dot(axes.coords_to_point(0, 0), color=YELLOW)
        self.add(moving_dot)

        # Move horizontally for x = -2.5
        self.play(moving_dot.animate.move_to(axes.coords_to_point(-2.5, 0)), run_time=1.5)
        x_line_5 = DashedLine(axes.coords_to_point(-2.5, 0), axes.coords_to_point(-2.5, -2.5), color=BLUE)
        self.play(Create(x_line_5))

        # Move vertically for y = -2.5
        self.play(moving_dot.animate.move_to(axes.coords_to_point(-2.5, -2.5)), run_time=1.5)
        y_line_5 = DashedLine(axes.coords_to_point(0, -2.5), axes.coords_to_point(-2.5, -2.5), color=GREEN)
        self.play(Create(y_line_5))

        final_dot_5 = Dot(axes.coords_to_point(-2.5, -2.5), color=RED)
        self.play(FadeIn(final_dot_5))
        label_5 = Tex("(-2.5, -2.5)").next_to(final_dot_5, DOWN + LEFT, buff=0.1).set_color(RED)
        self.play(Write(label_5))

        self.remove(moving_dot)
        self.wait(1.5)
        self.play(FadeOut(graphing_text, x_line_5, y_line_5))

        # 6. Conclusion
        conclusion_text = Text("You can now graph any point (x, y) on the X-Y Plane!", font_size=35).to_edge(DOWN).set_color(YELLOW)
        self.play(Write(conclusion_text))

        all_dots = VGroup(final_dot_1, final_dot_2, final_dot_3, final_dot_4, final_dot_5)
        self.play(Flash(all_dots, color=WHITE, flash_radius=0.5))

        self.wait(2)
        self.play(FadeOut(*self.mobjects))
