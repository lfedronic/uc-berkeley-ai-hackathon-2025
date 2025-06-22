
from manim import *

class MatrixMultiplicationScene(Scene):
    def construct(self):
        # Part 1: Computational Process Animation

        # Define the matrices and symbols
        matrix_A_values = [[1, 2], [3, 4]]
        matrix_B_values = [[5, 6], [7, 8]]

        matrix_A = Matrix(matrix_A_values)
        matrix_B = Matrix(matrix_B_values)
        matrix_C = Matrix([[0, 0], [0, 0]]) # Initially empty

        times_sign = MathTex(r"\times")
        equals_sign = MathTex("=")

        # Positioning
        group = VGroup(matrix_A, times_sign, matrix_B, equals_sign, matrix_C).arrange(buff=0.5)

        self.play(FadeIn(group))
        self.wait()

        # Calculate c11
        row1_A = matrix_A.get_rows()[0]
        col1_B = matrix_B.get_columns()[0]

        rect_A1 = SurroundingRectangle(row1_A, color=RED)
        rect_B1 = SurroundingRectangle(col1_B, color=BLUE)

        self.play(Create(rect_A1), Create(rect_B1))

        c11_calculation = MathTex("(1 \\times 5) + (2 \\times 7) = 19")
        c11_calculation.next_to(group, DOWN, buff=0.5)

        self.play(Create(c11_calculation))
        self.wait()

        matrix_C_19 = MathTex("19").move_to(matrix_C.get_entries()[0])

        self.play(ReplacementTransform(c11_calculation, matrix_C_19))

        self.play(FadeOut(rect_A1), FadeOut(rect_B1), FadeIn(matrix_C)) # FadeIn(matrix_C))
        self.wait()

        # Calculate c12
        row1_A = matrix_A.get_rows()[0]
        col2_B = matrix_B.get_columns()[1]

        rect_A1 = SurroundingRectangle(row1_A, color=RED)
        rect_B2 = SurroundingRectangle(col2_B, color=BLUE)

        self.play(Create(rect_A1), Create(rect_B2))

        c12_calculation = MathTex("(1 \\times 6) + (2 \\times 8) = 22")
        c12_calculation.next_to(group, DOWN, buff=0.5)

        self.play(Create(c12_calculation))
        self.wait()

        matrix_C_22 = MathTex("22").move_to(matrix_C.get_entries()[1])
        self.play(ReplacementTransform(c12_calculation, matrix_C_22))
        self.play(FadeOut(rect_A1), FadeOut(rect_B2), FadeIn(matrix_C))
        self.wait()

        # Calculate c21
        row2_A = matrix_A.get_rows()[1]
        col1_B = matrix_B.get_columns()[0]

        rect_A2 = SurroundingRectangle(row2_A, color=RED)
        rect_B1 = SurroundingRectangle(col1_B, color=BLUE)

        self.play(Create(rect_A2), Create(rect_B1))

        c21_calculation = MathTex("(3 \\times 5) + (4 \\times 7) = 43")
        c21_calculation.next_to(group, DOWN, buff=0.5)

        self.play(Create(c21_calculation))
        self.wait()

        matrix_C_43 = MathTex("43").move_to(matrix_C.get_entries()[2])
        self.play(ReplacementTransform(c21_calculation, matrix_C_43))
        self.play(FadeOut(rect_A2), FadeOut(rect_B1), FadeIn(matrix_C))
        self.wait()

        # Calculate c22
        row2_A = matrix_A.get_rows()[1]
        col2_B = matrix_B.get_columns()[1]

        rect_A2 = SurroundingRectangle(row2_A, color=RED)
        rect_B2 = SurroundingRectangle(col2_B, color=BLUE)

        self.play(Create(rect_A2), Create(rect_B2))

        c22_calculation = MathTex("(3 \\times 6) + (4 \\times 8) = 50")
        c22_calculation.next_to(group, DOWN, buff=0.5)

        self.play(Create(c22_calculation))
        self.wait()

        matrix_C_50 = MathTex("50").move_to(matrix_C.get_entries()[3])

        self.play(ReplacementTransform(c22_calculation, matrix_C_50))
        self.play(FadeOut(rect_A2), FadeOut(rect_B2))
        self.wait(2)

        new_matrix_C_values = [[19, 22], [43, 50]]
        new_matrix_C = Matrix(new_matrix_C_values).move_to(matrix_C.get_center())
        self.play(ReplacementTransform(matrix_C, new_matrix_C))

        #Fade Part 1
        self.play(FadeOut(matrix_A), FadeOut(matrix_B), FadeOut(times_sign), FadeOut(equals_sign))
        self.wait()
        self.play(new_matrix_C.animate.to_edge(UP))

        #Part 2 - Matrix Transformations
        # Set up NumberPlane and basis vectors
        plane = NumberPlane()
        self.play(Create(plane))

        i_hat = Vector([1, 0], color=RED)
        j_hat = Vector([0, 1], color=BLUE)

        i_hat_label = MathTex("\\hat{i}").next_to(i_hat, RIGHT)
        j_hat_label = MathTex("\\hat{j}").next_to(j_hat, UP)

        self.play(Create(i_hat), Create(j_hat), FadeIn(i_hat_label), FadeIn(j_hat_label))
        self.wait()

        # Unit square
        square = Rectangle(width=1, height=1, color=YELLOW).move_to([0.5,0.5,0])

        self.play(Create(square))
        self.wait()

        # Define the transformation matrix
        matrix_T_values = [[2, 1], [1, 2]]
        matrix_T = Matrix(matrix_T_values).to_edge(DOWN)
        text_T = MathTex("T = ").next_to(matrix_T,LEFT)
        self.play(FadeIn(text_T), FadeIn(matrix_T))

        #Transform i and j h
