
from manim import *
import numpy as np

class MatrixMultiplicationExplanation(Scene):
    def construct(self):
        # 1. Setup
        matrix_a_np = np.array([[1, 2], [3, 4]])
        matrix_b_np = np.array([[5, 6], [7, 8]])

        matrix_a = Matrix(matrix_a_np).set_color(BLUE)
        matrix_b = Matrix(matrix_b_np).set_color(RED)
        
        matrix_c_initial_np = np.array([["?", "?"], ["?", "?"]])
        matrix_c = Matrix(matrix_c_initial_np).set_color(GREEN)

        times_sign = MathTex(r"\times").scale(1.5)
        equals_sign = MathTex("=").scale(1.5)

        group_equation = VGroup(matrix_a, times_sign, matrix_b, equals_sign, matrix_c)
        group_equation.arrange(buff=0.7).move_to(ORIGIN)

        self.play(FadeIn(group_equation))
        self.wait(1)

        # 2. Calculate C[0,0]
        self.calculate_matrix_element(matrix_a, matrix_b, matrix_c, 0, 0, matrix_c_initial_np[0,0])

        # 3. Calculate C[0,1]
        self.calculate_matrix_element(matrix_a, matrix_b, matrix_c, 0, 1, matrix_c_initial_np[0,1])

        # 4. Calculate C[1,0]
        self.calculate_matrix_element(matrix_a, matrix_b, matrix_c, 1, 0, matrix_c_initial_np[1,0])
        
        # 5. Calculate C[1,1]
        self.calculate_matrix_element(matrix_a, matrix_b, matrix_c, 1, 1, matrix_c_initial_np[1,1])

        # 6. Final Result
        self.play(FadeOut(group_equation[1]), FadeOut(group_equation[3])) # Remove times and equals
        self.play(group_equation.animate.arrange(buff=1.0).center()) # Re-arrange just A, B, C
        self.wait(2)

    def calculate_matrix_element(self, mat_a, mat_b, mat_c, row_idx, col_idx, placeholder_text):
        # Get elements for the calculation
        a_row = mat_a.get_rows()[row_idx]
        b_col = mat_b.get_columns()[col_idx]
        
        # Highlight row and column
        try:
            self.play(
            Indicate(a_row, color=YELLOW),
            Indicate(b_col, color=YELLOW)
            )
        except Exception as e:
            print(f'❌ Error: {e}')
        self.wait(0.5)

        products_vg = VGroup()
        sum_components = []
        calculations = []

        # Calculate individual products
        for i in range(len(a_row)):
            a_val = int(a_row[i].get_text())
            b_val = int(b_col[i].get_text())
            product_val = a_val * b_val

            # Display the multiplication expression
            prod_expr = MathTex(f"{a_val} \\times {b_val}").next_to(mat_c, DOWN + (i * RIGHT * 2), buff=0.5)
            try:
                self.play(
                Create(prod_expr),
                Transform(a_row[i].copy(), prod_expr[0]), # Move a_val to its spot in expression
                Transform(b_col[i].copy(), prod_expr[2]), # Move b_val to its spot in expression
                )
            except Exception as e:
                print(f'❌ Error: {e}')
            self.wait(0.5)

            # Display the product result
            prod_result = MathTex(f"={product_val}").next_to(prod_expr, RIGHT, buff=0.2)
            self.play(Create(prod_result))
            self.wait(0.5)

            products_vg.add(prod_expr, prod_result)
            sum_components.append(product_val)
            calculations.append(prod_result)

        self.wait(1)

        # Summation
        final_sum = sum(sum_components)
        sum_expr_text = " + ".join([str(val) for val in sum_components])
        sum_expr = MathTex(f"{sum_expr_text}").next_to(products_vg, DOWN, buff=0.5)
        sum_result = MathTex(f" = {final_sum}").next_to(sum_expr, RIGHT, buff=0.2)

        try:
            self.play(
            LaggedStart(*[Transform(calc.copy(), sum_expr[i]) for i, calc in enumerate(calculations)]), # Animate results moving to sum expression
            Create(sum_expr),
            run_time=1.5
            )
        except Exception as e:
            print(f'❌ Error: {e}')
        self.play(Create(sum_result))
        self.wait(1)

        # Update the result matrix
        target_cell = mat_c.get_entries_as_rows()[row_idx][col_idx]
        new_value_mobject = MathTex(str(final_sum)).move_to(target_cell)

        try:
            self.play(
            Transform(sum_result.copy(), new_value_mobject),
            FadeOut(products_vg, sum_expr, sum_result) # Clean up temporary objects
            )
        except Exception as e:
            print(f'❌ Error: {e}')
        # Directly replace the text in the matrix
        mat_c.get_entries_as_rows()[row_idx][col_idx].become(new_value_mobject)
        self.wait(1)
