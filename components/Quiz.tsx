'use client';

import { useState } from 'react';
import { GeneratedQuiz, QuizQuestion } from '@/lib/agents/quizAgent';
import { CheckCircle, XCircle, Clock, Trophy } from 'lucide-react';

interface QuizProps {
  quiz: GeneratedQuiz;
  onComplete?: (score: number, totalPoints: number) => void;
}

interface UserAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  points: number;
}

export default function Quiz({ quiz, onComplete }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<UserAnswer[]>([]);
  const [startTime] = useState(Date.now());

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const checkAnswer = (question: QuizQuestion, userAnswer: string): boolean => {
    // Handle case where correctAnswer might be undefined or not a string
    if (!question.correctAnswer || typeof question.correctAnswer !== 'string') {
      console.warn('Missing or invalid correctAnswer for question:', question.id);
      return false;
    }
    
    const correctAnswer = question.correctAnswer.toLowerCase().trim();
    const userAnswerNormalized = userAnswer.toLowerCase().trim();

    switch (question.type) {
      case 'mcq':
      case 'true-false':
        return correctAnswer === userAnswerNormalized;
      case 'short-answer':
        // For short answers, we'll do a simple contains check
        // In a real app, you might want more sophisticated matching
        return correctAnswer.includes(userAnswerNormalized) || userAnswerNormalized.includes(correctAnswer);
      case 'fill-blank':
        return correctAnswer === userAnswerNormalized;
      default:
        return false;
    }
  };

  const submitQuiz = () => {
    const quizResults: UserAnswer[] = quiz.questions.map(question => {
      const userAnswer = userAnswers[question.id] || '';
      const isCorrect = checkAnswer(question, userAnswer);
      return {
        questionId: question.id,
        answer: userAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0
      };
    });

    setResults(quizResults);
    setShowResults(true);

    const totalScore = quizResults.reduce((sum, result) => sum + result.points, 0);
    onComplete?.(totalScore, quiz.totalPoints);
  };

  const nextQuestion = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const renderQuestion = (question: QuizQuestion) => {
    const userAnswer = userAnswers[question.id] || '';

    switch (question.type) {
      case 'mcq':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={userAnswer === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-3">
            {['True', 'False'].map((option) => (
              <label key={option} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={userAnswer === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'short-answer':
        return (
          <textarea
            value={userAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer here..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
          />
        );

      case 'fill-blank':
        const questionParts = question.question.split('[BLANK]');
        return (
          <div className="flex items-center space-x-2 text-lg">
            <span>{questionParts[0]}</span>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
              placeholder="Fill in the blank"
            />
            <span>{questionParts[1]}</span>
          </div>
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (showResults) {
    const totalScore = results.reduce((sum, result) => sum + result.points, 0);
    const percentage = Math.round((totalScore / quiz.totalPoints) * 100);
    const timeElapsed = Math.round((Date.now() - startTime) / 1000 / 60);

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
          <div className="text-6xl font-bold text-blue-600 mb-2">{percentage}%</div>
          <p className="text-xl text-gray-600">
            You scored {totalScore} out of {quiz.totalPoints} points
          </p>
          <p className="text-gray-500">
            Completed in {timeElapsed} minute{timeElapsed !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Review Your Answers</h3>
          {quiz.questions.map((question, index) => {
            const result = results.find(r => r.questionId === question.id);
            const isCorrect = result?.isCorrect || false;

            return (
              <div key={question.id} className={`p-6 rounded-lg border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-start space-x-3 mb-4">
                  {isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 mt-1" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Question {index + 1} ({question.points} point{question.points !== 1 ? 's' : ''})
                    </h4>
                    <p className="text-gray-700 mb-3">{question.question}</p>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-600">Your answer: </span>
                        <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                          {result?.answer || 'No answer provided'}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div>
                          <span className="font-medium text-gray-600">Correct answer: </span>
                          <span className="text-green-700">{question.correctAnswer}</span>
                        </div>
                      )}
                      <div className="mt-3 p-3 bg-white rounded border">
                        <span className="font-medium text-gray-600">Explanation: </span>
                        <span className="text-gray-700">{question.explanation}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Quiz Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
        <div className="flex items-center justify-center space-x-6 text-gray-600">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>{quiz.estimatedTime}</span>
          </div>
          <div>
            <span>{quiz.totalPoints} total points</span>
          </div>
        </div>
        <p className="text-gray-600 mt-2">{quiz.instructions}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
          <span>{Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Current Question */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {currentQuestion.difficulty} • {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
            </span>
            <span className="text-sm text-gray-500 capitalize">
              {currentQuestion.type.replace('-', ' ')}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQuestion.question}
          </h2>
        </div>

        {renderQuestion(currentQuestion)}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={prevQuestion}
          disabled={isFirstQuestion}
          className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex space-x-3">
          {!isLastQuestion ? (
            <button
              onClick={nextQuestion}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next Question
            </button>
          ) : (
            <button
              onClick={submitQuiz}
              className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 