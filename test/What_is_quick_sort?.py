
from manim import *

class QuickSortAnimation(Scene):
    def construct(self):
        # Initial unsorted array
        initial_array_values = [7, 2, 9, 4, 1, 8, 3, 6, 5]
        
        # Create the visual representation of the array
        array_mobjects = self.create_array_mobjects(initial_array_values)
        
        # Add a label for the array
        array_label = Text("Array Elements:", font_size=24).to_edge(UP).shift(DOWN * 0.5)
        
        # Initial display of the array and label
        self.play(FadeIn(array_label), FadeIn(array_mobjects))
        self.wait(1)

        # Start the Quick Sort animation process
        self.quick_sort_animation(array_mobjects, 0, len(initial_array_values) - 1)

        # Indicate that the array is sorted at the end
        self.play(self.get_sorted_indicator(array_mobjects), run_time=2)
        self.wait(2)

    def create_array_mobjects(self, values):
        """
        Creates a VGroup of Square objects, each containing a Text label for its value.
        Each element is a VGroup of [Square, Text].
        """
        array_squares = VGroup()
        for i, val in enumerate(values):
            # Create the square for the element
            square = Square(side_length=1.0, color=BLUE, stroke_width=2)
            # Create the text label for the value
            text = Text(str(val), font_size=24).move_to(square.get_center())
            
            # Group the square and text so they move together
            element_mobject = VGroup(square, text)
            element_mobject.value = val  # Store the actual value for easy access
            array_squares.add(element_mobject)
        
        # Arrange the elements horizontally with a buffer
        array_squares.arrange(RIGHT, buff=0.2)
        # Position the array below the potential label area
        array_squares.shift(DOWN * 0.5) 
        return array_squares

    def get_pointer(self, label_text, color):
        """
        Creates a pointer visual: a small triangle pointing down with a text label below it.
        """
        # Small triangle to act as the pointer tip
        pointer_triangle = Triangle(fill_opacity=1, color=color).scale(0.2)
        # Text label for the pointer (e.g., "low", "high", "i", "j")
        pointer_label = Text(label_text, font_size=20, color=color)
        # Group them together and arrange vertically
        pointer_group = VGroup(pointer_triangle, pointer_label).arrange(DOWN, buff=0.1)
        return pointer_group

    def move_pointer_to_element(self, pointer, element_mobject):
        """
        Animates a pointer Mobject to be positioned above a specific array element Mobject.
        """
        # Calculate the target position: centered above the element, with some vertical offset
        target_pos = element_mobject.get_center() + DOWN * (element_mobject.height / 2 + 0.3)
        # Animate the pointer moving to this target position
        return pointer.animate.move_to(target_pos)

    def swap_elements(self, array_mobjects, idx1, idx2):
        """
        Animates the visual swapping of two elements within the array_mobjects VGroup.
        This involves reordering the VGroup and animating the positions of the Mobjects.
        """
        # If indices are the same, no swap is needed
        if idx1 == idx2:
            return Wait()

        # Get the Mobjects to be swapped
        mobj1 = array_mobjects[idx1]
        mobj2 = array_mobjects[idx2]

        # Store their current positions to animate their movement
        pos1_target = mobj2.get_center()
        pos2_target = mobj1.get_center()

        # Crucially, reorder the Mobjects within the array_mobjects VGroup
        # This ensures that subsequent indexing (e.g., array_mobjects[idx1])
        # refers to the correct visual element after the swap.
        array_mobjects[idx1], array_mobjects[idx2] = array_mobjects[idx2], array_mobjects[idx1]

        # Create an animation group to move both Mobjects simultaneously
        swap_animation = AnimationGroup(
            mobj1.animate.move_to(pos1_target),
            mobj2.animate.move_to(pos2_target)
        )
        return swap_animation

    def get_value_from_element_mobject(self, element_mobject):
        """
        Helper function to extract the numerical value stored in an element Mobject (VGroup).
        """
        return element_mobject.value

    def get_sorted_indicator(self, array_mobjects):
        """
        Creates an animation group that sets the fill color of all array elements to GREEN,
        signifying that they are now sorted.
        """
        animations = []
        for element in array_mobjects:
            # Animate the Square part of the element Mobject
            animations.append(element[0].animate.set_fill(color=GREEN, opacity=1))
        # Return a group of these animations to be played together
        return AnimationGroup(*animations)

    def quick_sort_animation(self, array_mobjects, low_idx, high_idx):
        """
        The main recursive function to animate the Quick Sort algorithm.
        It handles visualizing sub-arrays, pivot selection, partitioning, and recursive calls.
        """
        # Base case: If the sub-array has 0 or 1 element, it's already sorted.
        if low_idx >= high_idx:
            # If it's a single element sub-array, mark it as sorted green.
            if low_idx == high_idx:
                self.play(array_mobjects[low_idx][0].animate.set_fill(color=GREEN, opacity=1))
            return # Exit the recursion for this branch

        # --- Visualize the current sub-array being processed ---
        # Create a rectangle to highlight the current sub-array boundaries
        sub_array_rect = Rectangle(
            # Calculate width to span from the start of the low element to the end of the high element
            width=array_mobjects[high_idx].get_right()[0] - array_mobjects[low_idx].get_left()[0] + 0.2,
            height=array_mobjects[0].height + 0.4, # Height slightly larger than an element
            stroke_color=GREY,
            fill_color=GREY,
            fill_opacity=0.1 # Semi-transparent fill
        )
        # Position the rectangle to enclose the sub-array
        sub_array_rect.move_to(VGroup(*array_mobjects[low_idx : high_idx + 1]).get_center())
        
        # Create text to indicate the current range being sorted
        sub_array_text = Text(f"Sorting [{low_idx} ... {high_idx}]", font_size=25).next_to(sub_array_rect, UP)

        # Play animations to show the sub-array context
        self.play(FadeIn(sub_array_rect), FadeIn(sub_array_text))
        self.wait(0.5)

        # --- Pivot Selection ---
        # Get the Mobject representing the pivot (the last element of the sub-array)
        pivot_mobject = array_mobjects[high_idx]
        pivot_value = self.get_value_from_element_mobject(pivot_mobject)

        # Visual cue for the pivot: highlight it with yellow and scale up
        pivot_label = Text("Pivot!", font_size=25).next_to(pivot_mobject, UP)
        self.play(
            pivot_mobject[0].animate.set_fill(color=YELLOW, opacity=1), # Change fill color
            pivot_mobject.animate.scale(1.2), # Scale up
            FadeIn(pivot_label) # Show "Pivot!" label
        )
        self.wait(1)
        # Revert the pivot's appearance after highlighting
        self.play(
            pivot_mobject[0].animate.set_fill(color=BLUE, opacity=1), # Revert fill color
            pivot_mobject.animate.scale(1/1.2), # Revert scale
            FadeOut(pivot_label) # Remove "Pivot!" label
        )
        self.wait(0.5)

        # --- Partitioning Process (Lomuto Partition Scheme) ---
        # Initialize pointers: 'i' starts at low - 1, 'j' starts at low
        # Create the 'i' pointer visual
        # Position 'i' just to the left of the first element of the sub-array
        i_pointer = self.get_pointer("i", GREEN).next_to(array_mobjects[low_idx], DOWN).shift(LEFT * (array_mobjects[low_idx].width + 0.2))
        # Create the 'j' pointer visual
        # Position 'j' under the first element of the sub-array
        j_pointer = self.get_pointer("j", PURPLE).next_to(array_mobjects[low_idx], DOWN)

        # Fade in the pointers to start the partitioning
        self.play(FadeIn(i_pointer), FadeIn(j_pointer))

        # 'i_val' is the actual index for the 'i' pointer in the array, used for swapping
        i_val = low_idx - 1 
        
        # Iterate through the sub-array from 'low_idx' up to (but not including) 'high_idx'
        for j_val in range(low_idx, high_idx):
            # Get the Mobject and value for the current 'j' position
            current_j_mobject = array_mobjects[j_val]
            current_j_value = self.get_value_from_element_mobject(current_j_mobject)

            # Animate 'j' pointer moving to the current element
            self.play(self.move_pointer_to_element(j_pointer, current_j_mobject))
            # Highlight the element at 'j' for comparison
            self.play(current_j_mobject[0].animate.set_fill(color=ORANGE, opacity=1))

            # Display the comparison text
            comparison_text = Text(f"Is {current_j_value} <= {pivot_value}?", font_size=25).next_to(array_mobjects, UP * 2)
            self.play(FadeIn(comparison_text))
            self.wait(0.5)

            # Check if the current element is less than or equal to the pivot
            if current_j_value <= pivot_value:
                # If true: increment 'i', then swap arr[i] and arr[j]
                i_val += 1
                # Display the action taken
                result_text = Text(f"True. Increment i, then Swap arr[{i_val}] and arr[{j_val}].", font_size=25).next_to(comparison_text, DOWN)
                self.play(FadeIn(result_text), self.move_pointer_to_element(i_pointer, array_mobjects[i_val])) # Move 'i' pointer to new position
                self.wait(0.5)
                
                # Animate the swap between element at 'i_val' and 'j_val'
                self.play(self.swap_elements(array_mobjects, i_val, j_val))
                self.wait(0.5)
            else:
                # If false: 'j' moves on without swapping
                result_text = Text(f"False. j moves on.", font_size=25).next_to(comparison_text, DOWN)
                self.play(FadeIn(result_text))
                self.wait(0.5)

            # Clean up comparison and result texts
            self.play(FadeOut(comparison_text), FadeOut(result_text))
            # Revert the color of the element at 'j' to normal
            self.play(current_j_mobject[0].animate.set_fill(color=BLUE, opacity=1))
            self.wait(0.2)
        
        # --- Final Pivot Placement ---
        # After the loop, 'i_val' points to the last element that was less than or equal to the pivot.
        # The pivot needs to be swapped with the element at `i_val + 1`.
        i_val += 1 
        # Move the 'i' pointer to its final position for the pivot swap
        self.play(self.move_pointer_to_element(i_pointer, array_mobjects[i_val]))
        # Display text for the final pivot swap
        final_swap_text = Text(f"Swap arr[{i_val}] and Pivot (arr[{high_idx}]).", font_size=25).next_to(array_mobjects, UP * 2)
        self.play(FadeIn(final_swap_text))
        self.wait(0.5)
        
        # Perform the swap between the element at `i_val` and the pivot (at `high_idx`)
        self.play(self.swap_elements(array_mobjects, i_val, high_idx))
        # Mark the pivot's new position (at `i_val`) as permanently sorted (GREEN)
        self.play(array_mobjects[i_val][0].animate.set_fill(color=GREEN, opacity=1)) 
        # Clean up pointers and the final swap text
        self.play(FadeOut(final_swap_text), FadeOut(i_pointer), FadeOut(j_pointer))
        self.wait(1)

        # 'pivot_final_index' is the index where the pivot ended up after partitioning
        pivot_final_index = i_val

        # --- Clean up current sub-array visualization ---
        self.play(FadeOut(sub_array_rect), FadeOut(sub_array_text)) 

        # --- Recursive Calls ---
        # Recursively call quick_sort for the left sub-array (elements before the pivot)
        self.quick_sort_animation(array_mobjects, low_idx, pivot_final_index - 1)

        # Recursively call quick_sort for the right sub-array (elements after the pivot)
        self.quick_sort_animation(array_mobjects, pivot_final_index + 1, high_idx)
