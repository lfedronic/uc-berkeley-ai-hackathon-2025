from manim import *

class QuickSort(MovingCameraScene):
    def construct(self):
        self.camera.frame.scale(1.2)
        array = [5, 2, 8, 1, 9, 4, 7, 6, 3]
        rects = VGroup(*[Rectangle(width=0.5, height=0.5).shift(i * 0.6 * RIGHT) for i in range(len(array))])
        texts = VGroup(*[Text(str(array[i])).move_to(rects[i].get_center()) for i in range(len(array))])
        group = VGroup(rects, texts).move_to(ORIGIN)

        self.play(Write(group))

        def partition(arr, low, high):
            pivot = arr[high]
            i = low - 1

            for j in range(low, high):
                if arr[j] <= pivot:
                    i += 1
                    arr[i], arr[j] = arr[j], arr[i]
                    self.play(
                        group[1][i].animate.move_to(rects[j].get_center()),
                        group[1][j].animate.move_to(rects[i].get_center())
                    )
                    rects[i], rects[j] = rects[j], rects[i]
                    group[0] = VGroup(*rects)
            arr[i + 1], arr[high] = arr[high], arr[i + 1]
            self.play(
                group[1][i + 1].animate.move_to(rects[high].get_center()),
                group[1][high].animate.move_to(rects[i + 1].get_center())
            )
            rects[i + 1], rects[high] = rects[high], rects[i + 1]
            group[0] = VGroup(*rects)
            return i + 1

        def quick_sort(arr, low, high):
            if low < high:
                pi = partition(arr, low, high)
                quick_sort(arr, low, pi - 1)
                quick_sort(arr, pi + 1, high)

        quick_sort(array, 0, len(array) - 1)
        self.wait(2)