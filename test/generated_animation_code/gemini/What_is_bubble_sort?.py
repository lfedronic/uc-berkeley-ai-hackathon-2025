from manim import *

from manim import Scene, MovingCameraScene, Rectangle, Text, VGroup
from manim import UP, DOWN, LEFT, RIGHT, ORIGIN, WHITE, BLACK, RED, GREEN, BLUE, YELLOW, PURPLE, ORANGE

class BubbleSortAnimation(MovingCameraScene):
    def construct(self):
        # --- Configuration ---
        array_values = [5, 1, 4, 2, 8]
        rect_width = 1.5
        rect_height_base = 0.5 # Base height for all rectangles
        rect_spacing = 0.2
        default_rect_color = BLUE
        default_text_color = WHITE
        compare_color = RED
        swap_color = GREEN
        sorted_color = PURPLE

        # --- Title ---
        title = Text("Bubble Sort Visualization", font_size=48).to_edge(UP)
        self.play(FadeIn(title))
        self.wait(0.5)

        # --- Create Array Mobjects ---
        mobject_array = VGroup()
        
        # Create VGroup for each element (Rectangle + Text)
        for i, val in enumerate(array_values):
            # Rectangle height proportional to value for better visual distinction
            # Max value is 8, scale to fit within reasonable height
            rect_height = rect_height_base + (val / 10.0) * 2.0 
            rect = Rectangle(width=rect_width, height=rect_height, color=default_rect_color, fill_opacity=0.7)
            text = Text(str(val), font_size=36, color=default_text_color)
            
            # Group rectangle and text
            element_group = VGroup(rect, text)
            
            # Position the text inside the rectangle
            text.move_to(rect.get_center()) 
            
            mobject_array.add(element_group)

        # Arrange the elements horizontally and center them
        mobject_array.arrange(buff=rect_spacing)
        mobject_array.move_to(ORIGIN) 

        self.play(FadeIn(mobject_array))
        self.wait(1)

        # --- Labels for comparison/swap ---
        comparison_label = Text("", font_size=30).next_to(mobject_array, DOWN, buff=1.0)
        self.add(comparison_label) # Add it to the scene once

        n = len(array_values)

        # --- Bubble Sort Algorithm ---
        for i in range(n):
            # Pass label
            pass_label = Text(f"Pass {i + 1}", font_size=36, color=YELLOW).next_to(title, DOWN)
            self.play(FadeIn(pass_label))
            self.wait(0.5)

            swapped_in_pass = False

            for j in range(n - 1 - i):
                # Get the two elements to compare
                element1_group = mobject_array[j]
                element2_group = mobject_array[j+1]
                
                # Highlight elements being compared
                self.play(
                    element1_group[0].animate.set_color(compare_color), # Rectangle color
                    element2_group[0].animate.set_color(compare_color),
                    run_time=0.5
                )

                # Update comparison label text
                comparison_label.set_text(f"Comparing {array_values[j]} and {array_values[j+1]}")
                self.play(comparison_label.animate.set_color(WHITE)) # Ensure label color is white
                self.wait(0.5)

                if array_values[j] > array_values[j+1]:
                    swapped_in_pass = True
                    
                    # Update comparison label for swap decision
                    comparison_label.set_text(f"{array_values[j]} > {array_values[j+1]}? Yes! Swapping...")
                    self.play(comparison_label.animate.set_color(GREEN))
                    self.wait(0.5)

                    # Highlight elements for swap
                    self.play(
                        element1_group[0].animate.set_color(swap_color),
                        element2_group[0].animate.set_color(swap_color),
                        run_time=0.5
                    )

                    # Animate swap positions
                    pos1 = element1_group.get_center()
                    pos2 = element2_group.get_center()

                    self.play(
                        element1_group.animate.move_to(pos2),
                        element2_group.animate.move_to(pos1),
                        run_time=1
                    )

                    # Update internal array_values and mobject_array list
                    # This is crucial for correct logic and subsequent animations
                    array_values[j], array_values[j+1] = array_values[j+1], array_values[j]
                    mobject_array[j], mobject_array[j+1] = mobject_array[j+1], mobject_array[j]

                else:
                    # No swap needed
                    comparison_label.set_text(f"{array_values[j]} > {array_values[j+1]}? No! No swap needed.")
                    self.play(comparison_label.animate.set_color(RED))
                    self.wait(1)

                # Reset colors to default and fade out comparison label
                self.play(
                    element1_group[0].animate.set_color(default_rect_color),
                    element2_group[0].animate.set_color(default_rect_color),
                    FadeOut(comparison_label), 
                    run_time=0.5
                )
                comparison_label.set_color(WHITE) # Reset color for next use, though it's faded out

            # After each pass, the largest unsorted element is in its correct place
            # Highlight the sorted element at the end of the current pass
            self.play(
                mobject_array[n - 1 - i][0].animate.set_color(sorted_color),
                run_time=0.7
            )
            self.play(FadeOut(pass_label))

            # Optimization: If no swaps occurred in a pass, the array is sorted
            if not swapped_in_pass:
                break

        # --- Final State ---
        final_label = Text("Array Sorted!", font_size=48, color=GREEN).next_to(mobject_array, DOWN, buff=1.5)
        self.play(FadeIn(final_label))
        
        # Ensure all elements are highlighted as sorted
        for k in range(n):
            if mobject_array[k][0].get_color() != sorted_color:
                self.play(mobject_array[k][0].animate.set_color(sorted_color), run_time=0.2)
        
        self.wait(2)
        self.play(FadeOut(title), FadeOut(mobject_array), FadeOut(final_label))
        self.wait(1)