
from manim import *

class QuickSortAnimation(Scene):
    def construct(self):
        initial_array = [50, 20, 70, 10, 60, 30, 40]
        array_mobject = VGroup()
        squares = []
        texts = []
        for i, num in enumerate(initial_array):
            square = Square(side_length=1).move_to(i * RIGHT * 1.5)
            text = Text(str(num)).move_to(square.get_center())
            squares.append(square)
            texts.append(text)
            array_mobject.add(VGroup(square, text))

        array_mobject.move_to(ORIGIN)
        try:
            self.play(Create(array_mobject), run_time=2)
        except Exception as e:
            print(f'❌ Error: {e}')

        title = Text("QuickSort Algorithm (Lomuto Partition)").to_edge(UP)
        try:
            self.play(Write(title))
        except Exception as e:
            print(f'❌ Error: {e}')

        low_pointer = Arrow(start=DOWN, end=squares[0].get_center() + DOWN * 1.5, buff=0)
        low_text = Text("low").next_to(low_pointer, DOWN)
        high_pointer = Arrow(start=DOWN, end=squares[-1].get_center() + DOWN * 1.5, buff=0)
        high_text = Text("high").next_to(high_pointer, DOWN)
        try:
            self.play(Create(low_pointer), Write(low_text))
        except Exception as e:
            print(f'❌ Error: {e}')
        try:
            self.play(Create(high_pointer), Write(high_text))
        except Exception as e:
            print(f'❌ Error: {e}')

        def get_mobject_at_index(index):
            return array_mobject[index]

        def swap_animation(i, j):
            return Transform(get_mobject_at_index(i), get_mobject_at_index(j).copy().move_to(squares[i].get_center())), \
                   Transform(get_mobject_at_index(j), get_mobject_at_index(i).copy().move_to(squares[j].get_center()))

        def quickSort(arr, low, high):
            if low < high:
                try:
                    self.play(Write(Text(f"quickSort(arr, {low}, {high})").move_to(UP*2)))
                except Exception as e:
                    print(f'❌ Error: {e}')
                try:
                    self.play(Write(Text("if low < high:").move_to(UP*1.5)))
                except Exception as e:
                    print(f'❌ Error: {e}')
                try:
                    self.wait(0.5)
                except Exception as e:
                    print(f'❌ Error: {e}')

                pivotIndex = partition(arr, low, high)
                try:
                    self.play(FadeOut(Text(f"quickSort(arr, {low}, {high})").move_to(UP*2)))
                except Exception as e:
                    print(f'❌ Error: {e}')
                try:
                    self.play(FadeOut(Text("if low < high:").move_to(UP*1.5)))
                except Exception as e:
                    print(f'❌ Error: {e}')

                try:
                    self.play(Indicate(squares[pivotIndex], color=GREEN))
                except Exception as e:
                    print(f'❌ Error: {e}')
                pivot_text = Text("Pivot Placed").next_to(squares[pivotIndex], UP)
                try:
                    self.play(Write(pivot_text))
                except Exception as e:
                    print(f'❌ Error: {e}')
                try:
                    self.wait(1)
                except Exception as e:
                    print(f'❌ Error: {e}')
                try:
                    self.play(FadeOut(pivot_text))
                except Exception as e:
                    print(f'❌ Error: {e}')

                try:
                    self.play(Write(Text(f"Recursively sorting left sub-array ({low} to {pivotIndex - 1})").move_to(DOWN*2)))
                except Exception as e:
                    print(f'❌ Error: {e}')
                try:
                    self.play(FadeOut(Text(f"Recursively sorting left sub-array ({low} to {pivotIndex - 1})").move_to(DOWN*2)))
                except Exception as e:
                    print(f'❌ Error: {e}')
                quickSort(arr, low, pivotIndex - 1)


                try:
                    self.play(Write(Text(f"Recursively sorting right sub-array ({pivotIndex + 1} to {high})").move_to(DOWN*2)))
                except Exception as e:
                    print(f'❌ Error: {e}')
                try:
                    self.play(FadeOut(Text(f"Recursively sorting right sub-array ({pivotIndex + 1} to {high})").move_to(DOWN*2)))
                except Exception as e:
                    print(f'❌ Error: {e}')
                quickSort(arr, pivotIndex + 1, high)

        def partition(arr, low, high):
            pivot = arr[high]
            pivot_element = VGroup(squares[high], texts[high])
            try:
                self.play(Write(Text("Selecting Pivot (Last Element)").move_to(UP*2)))
            except Exception as e:
                print(f'❌ Error: {e}')
            try:
                self.play(Indicate(squares[high], color=YELLOW))
            except Exception as e:
                print(f'❌ Error: {e}')
            pivot_label = Text("Pivot").next_to(squares[high], DOWN)
            try:
                self.play(Write(pivot_label))
            except Exception as e:
                print(f'❌ Error: {e}')
            try:
                self.play(FadeOut(Text("Selecting Pivot (Last Element)").move_to(UP*2)))
            except Exception as e:
                print(f'❌ Error: {e}')

            i = low - 1
            i_pointer = Arrow(start=DOWN, end=squares[0].get_center() + LEFT * 1.5 + DOWN* 1.5, buff=0)
            i_text = Text("i").next_to(i_pointer, DOWN)
            try:
                self.play(Write(Text("Initializing partition pointers").move_to(UP*2)))
            except Exception as e:
                print(f'❌ Error: {e}')
            j = low
            j_pointer = Arrow(start=DOWN, end=squares[j].get_center() + DOWN* 1.5, buff=0)
            j_text = Text("j").next_to(j_pointer, DOWN)

            try:
                self.play(Create(i_pointer), Write(i_text), Create(j_pointer), Write(j_text))
            except Exception as e:
                print(f'❌ Error: {e}')
            try:
                self.play(FadeOut(Text("Initializing partition pointers").move_to(UP*2)))
            except Exception as e:
                print(f'❌ Error: {e}')

            for j in range(low, high):
                try:
                    self.play(Write(Text(f"Comparing arr[{j}] with Pivot ({pivot})").move_to(UP*2)))
                except Exception as e:
                    print(f'❌ Error: {e}')
                try:
                    self.play(Indicate(squares[j], color=BLUE))
                except Exception as e:
                    print(f'❌ Error: {e}')
                if arr[j] <= pivot:
                    i += 1
                    try:
                        self.play(Write(Text(f"arr[{j}] is <= Pivot. Increment i and Swap").move_to(UP*1.5)))
                    except Exception as e:
                        print(f'❌ Error: {e}')
                    try:
                        self.play(ApplyMethod(i_pointer.move_to, squares[i].get_center() + DOWN * 1.5),
                        ApplyMethod(i_text.move_to, i_pointer.get_center() + DOWN), run_time = 0.5)
                    except Exception as e:
                        print(f'❌ Error: {e}')
                    try:
                        self.wait(0.3)
                    except Exception as e:
                        print(f'❌ Error: {e}')
                    try:
                        self.play(*swap_animation(i, j))
                    except Exception as e:
                        print(f'❌ Error: {e}')
                    arr[i], arr[j] = arr[j], arr[i]
                    texts[i].move_to(squares[i].get_center())
                    texts[j].move_to(squares[j].get_center())
                    squares[i], squares[j] = squares[j], squares[i]

                else:
                    try:
                        self.play(Write(Text(f"arr[{j}] is > Pivot. i remains same").move_to(UP*1.5)))
                    except Exception as e:
                        print(f'❌ Error: {e}')

                if j < high - 1:
                    try:
                        self.play(ApplyMethod(j_pointer.move_to, squares[j+1].get_center() + DOWN * 1.5),
                        ApplyMethod(j_text.move_to, j_pointer.get_center() + DOWN),run_time = 0.5)
                    except Exception as e:
                        print(f'❌ Error: {e}')
                try:
                    self.wait(0.3)
                except Exception as e:
                    print(f'❌ Error: {e}')

                try:
                    self.play(FadeOut(Text(f"arr[{j}] is <= Pivot. Increment i and Swap").move_to(UP*1.5)),
                    FadeOut(Text(f"arr[{j}] is > Pivot. i remains same").move_to(UP*1.5)),
                    FadeOut(Text(f"Comparing arr[{j}] with Pivot ({pivot})").move_to(UP*2))
                    )
                except Exception as e:
                    print(f'❌ Error: {e}')


            try:
                self.play(Write(Text("Loop finished. Placing Pivot").move_to(UP*2)))
            except Exception as e:
                print(f'❌ Error: {e}')
            try:
                self.wait(0.3)
            except Exception as e:
                print(f'❌ Error: {e}')
            try:
                self.play(ApplyMethod(i_pointer.move_to, squares[i+1].get_center() + DOWN * 1.5),
                ApplyMethod(i_text.move_to, i_pointer.get_center() + DOWN), run_time = 0.5)
            except Exception as e:
                print(f'❌ Error: {e}')
            try:
                self.wait(0.3)
            except Exception as e:
                print(f'❌ Error: {e}')
            try:
                self.play(*swap_animation(i + 1, high))
            except Exception as e:
                print(f'❌ Error: {e}')
            arr[i+1], arr[high] = arr[high], arr[i+1]
            texts[i+1].move_to(squares[i+1].get_center())
            texts[high].move_to(squares[high].get_center())
            squares[i+1], squares[high] = squares[high], squares[i+1]


            pivotIndex = i + 1
            try:
                self.play(FadeOut(low_pointer), FadeOut(low_text), FadeOut(high_pointer), FadeOut(high_text), FadeOut(i_pointer), FadeOut(i_text), FadeOut(j_pointer), FadeOut(j_text))
            except Exception as e:
                print(f'❌ Error: {e}')
            try:
                self.play(FadeOut(pivot_label), FadeOut(Text("Loop finished. Placing Pivot").move_to(UP*2)))
            except Exception as e:
                print(f'❌ Error: {e}')
            try:
                self.wait(1)
            except Exception as e:
                print(f'❌ Error: {e}')
            return pivotIndex

        quickSort(initial_array, 0, len(initial_array) - 1)

        try:
            self.play(Write(Text("QuickSort complete! Array is sorted.").move_to(DOWN*2)))
        except Exception as e:
            print(f'❌ Error: {e}')
        try:
            self.wait(2)
        except Exception as e:
            print(f'❌ Error: {e}')
        try:
            self.play(FadeOut(title))
        except Exception as e:
            print(f'❌ Error: {e}')
        try:
            self.wait(2)
        except Exception as e:
            print(f'❌ Error: {e}')

