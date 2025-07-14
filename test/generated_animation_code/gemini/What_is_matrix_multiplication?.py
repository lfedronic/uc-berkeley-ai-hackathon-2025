from manim import *

from manim import Scene, Rectangle, Text, VGroup, UP, DOWN, LEFT, RIGHT, ORIGIN, WHITE, BLACK, RED, GREEN, BLUE, YELLOW, PURPLE, ORANGE, Transform, FadeIn, FadeOut, Indicate

class BubbleSortAnimation(Scene):
    def construct(self):
        # Initial array values
        initial_array = [5, 1, 4, 2, 8]
        
        # Configuration for rectangles and text
        rect_width = 1.0
        rect_height = 1.0
        spacing = 0.1
        font_size = 36

        # Title
        title = Text("Bubble Sort Visualization", font_size=48).to_edge(UP)
        self.play(FadeIn(title))
        self.wait(0.5)

        # Create initial rectangles and texts
        array_mobjects = [] # This list will store VGroups of (Rectangle, Text) for each element
        for i, val in enumerate(initial_array):
            rect = Rectangle(
                width=rect_width,
                height=rect_height,
                color=WHITE,
                fill_opacity=0.8
            )
            text = Text(str(val), font_size=font_size, color=BLACK)
            
            element_group = VGroup(rect, text)
            array_mobjects.append(element_group)
            
        # Arrange the elements horizontally and position them on the screen
        array_vg = VGroup(*array_mobjects).arrange(RIGHT, buff=spacing).shift(DOWN * 0.5)
        
        self.play(FadeIn(array_vg))
        self.wait(1)

        # Current status label
        status_label = Text("Initial Array", font_size=32).next_to(array_vg, DOWN)
        self.play(FadeIn(status_label))
        self.wait(1)

        n = len(initial_array)
        arr = list(initial_array) # Use a mutable list to represent the array's current state for logic

        # Bubble Sort Algorithm
        for i in range(n - 1):
            # Update pass label
            self.play(status_label.animate.set_text(f"Pass {i + 1}"))
            self.wait(0.7)

            swapped_in_pass = False
            for j in range(n - 1 - i):
                # Get the Mobjects for the two elements being compared
                element_group_j = array_mobjects[j]
                element_group_j_plus_1 = array_mobjects[j+1]

                rect_j, text_j = element_group_j[0], element_group_j[1]
                rect_j_plus_1, text_j_plus_1 = element_group_j_plus_1[0], element_group_j_plus_1[1]

                # Highlight elements being compared in RED
                self.play(
                    rect_j.animate.set_color(RED),
                    rect_j_plus_1.animate.set_color(RED),
                    status_label.animate.set_text(f"Comparing {arr[j]} and {arr[j+1]}")
                )
                self.wait(0.7)

                if arr[j] > arr[j+1]:
                    # Swap values in the internal Python list
                    arr[j], arr[j+1] = arr[j+1], arr[j]
                    swapped_in_pass = True

                    # Change colors to GREEN to indicate a swap is happening
                    self.play(
                        rect_j.animate.set_color(GREEN),
                        rect_j_plus_1.animate.set_color(GREEN),
                        status_label.animate.set_text(f"Swapping {text_j.text} and {text_j_plus_1.text}")
                    )
                    self.wait(0.5)

                    # Store original positions for the Transform animation
                    pos_j = element_group_j.get_center()
                    pos_j_plus_1 = element_group_j_plus_1.get_center()

                    # Animate the swap of the Mobjects
                    self.play(
                        element_group_j.animate.move_to(pos_j_plus_1),
                        element_group_j_plus_1.animate.move_to(pos_j)
                    )
                    self.wait(0.7)

                    # Update the array_mobjects list so that subsequent accesses
                    # (e.g., array_mobjects[j]) refer to the correct Mobject
                    array_mobjects[j], array_mobjects[j+1] = array_mobjects[j+1], array_mobjects[j]
                else:
                    # No swap needed, revert colors to WHITE
                    self.play(
                        rect_j.animate.set_color(WHITE),
                        rect_j_plus_1.animate.set_color(WHITE),
                        status_label.animate.set_text(f"No swap needed for {arr[j]} and {arr[j+1]}")
                    )
                    self.wait(0.7)
                
                # Revert colors of the compared elements to WHITE for the next comparison
                self.play(
                    rect_j.animate.set_color(WHITE),
                    rect_j_plus_1.animate.set_color(WHITE)
                )
                self.wait(0.2)

            # After each pass, the largest unsorted element is in its final sorted position
            sorted_element_index = n - 1 - i
            # Highlight the sorted element in BLUE
            self.play(
                array_mobjects[sorted_element_index][0].animate.set_color(BLUE),
                status_label.animate.set_text(f"Element {array_mobjects[sorted_element_index][1].text} is sorted.")
            )
            self.wait(1)

            # Optimization: If no swaps occurred in a pass, the array is fully sorted
            if not swapped_in_pass:
                self.play(status_label.animate.set_text("Array is sorted (no swaps in this pass)."))
                self.wait(1)
                # Highlight any remaining unsorted elements as sorted (they must be)
                for k in range(sorted_element_index):
                    self.play(array_mobjects[k][0].animate.set_color(BLUE))
                break

        # Final state: all elements are sorted and highlighted in BLUE
        self.play(status_label.animate.set_text("Sorting Complete!"))
        # Ensure all elements are blue (in case the break condition was met early)
        for i in range(n):
            self.play(array_mobjects[i][0].animate.set_color(BLUE))
        self.wait(2)

        # Fade out all Mobjects at the end
        self.play(FadeOut(VGroup(title, array_vg, status_label)))
        self.wait(1)