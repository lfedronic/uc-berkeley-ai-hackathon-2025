
from manim import *

class MatrixMultiplicationAnimation(Scene):
    def construct(self):
        # Define matrices
        matrix_A = Matrix([[1, 2], [3, 4]])
        matrix_B = Matrix([[5, 6], [7, 8]])
        result_matrix = Matrix([["?", "?"], ["?", "?"]])

        # Position matrices
        matrix_A.to_corner(UL)
        matrix_B.next_to(matrix_A, RIGHT, buff=1)
        result_matrix.next_to(matrix_B, RIGHT, buff=1)

        # Multiplication and equals signs
        multiply_sign = MathTex(" \\times ").next_to(matrix_A, RIGHT)
        equals_sign = MathTex(" = ").next_to(matrix_B, RIGHT)

        # Create a group for initial matrices
        initial_group = VGroup(matrix_A, matrix_B, multiply_sign, equals_sign, result_matrix)

        # Display matrices
        self.play(FadeIn(initial_group))
        self.wait()

        # Highlight row and column for C_00
        rect_A_row = SurroundingRectangle(matrix_A.get_rows()[0])
        rect_B_col = SurroundingRectangle(matrix_B.get_columns()[0])
        self.play(Create(rect_A_row), Create(rect_B_col))
        self.play(Indicate(matrix_A.get_rows()[0]), Indicate(matrix_B.get_columns()[0]))
        self.wait()

        # Show the individual multiplication terms for C_00
        term1 = MathTex("1 \\times 5").move_to(0.5*UP + 2*LEFT)
        term2 = MathTex("2 \\times 7").next_to(term1, RIGHT)
        self.play(Write(term1), Write(term2))
        self.wait()

        # Sum of the terms
        sum_terms = MathTex("5 + 14 = 19").next_to(term2, DOWN)
        self.play(Write(sum_terms))
        self.wait()

        # Replace C_00
        new_result_matrix = Matrix([[19, "?"] , ["?", "?"]])
        new_result_matrix.move_to(result_matrix.get_center())
        self.play(ReplacementTransform(result_matrix,new_result_matrix))
        result_matrix = new_result_matrix

        self.wait()

        # Fade out intermediate calculations
        self.play(FadeOut(term1, term2, sum_terms, rect_A_row, rect_B_col))
        self.wait()

        # Animate Remaining Elements (Limited Detail)
        final_result_matrix = Matrix([[19, 22], [43, 50]])
        final_result_matrix.move_to(result_matrix.get_center())

        self.play(Transform(result_matrix, final_result_matrix))

        #Animate the brackets to be closer to the matrix

        self.wait(2)
