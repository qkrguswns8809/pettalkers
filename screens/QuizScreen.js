import { Text, View, Button, Alert, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet } from 'react-native';

const QUIZ_COOLDOWN = 5 * 60 * 1000; // 5분 (밀리초 단위)

const QuizScreen = () => {
    const [showTitle, setShowTitle] = useState(true);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [rankings, setRankings] = useState([]);
    const [user, setUser] = useState(null);
    const [cooldown, setCooldown] = useState(false);

    const navigation = useNavigation();

    const quizData = [
      { question: '어떤 견종이 가장 빠를까요?', options: ['보더 콜리', '그레이하운드', '시베리안 허스키', '닥스훈트'], answer: 1 },
      { question: '반려견이 가장 좋아하는 음식은 무엇인가요?', options: ['초콜릿', '치즈', '고양이 사료', '개껌'], answer: 1 },
      { question: '개의 나이를 사람의 나이로 환산하려면 어떤 비율을 사용해야 할까요?', options: ['1:5', '1:7', '1:10', '1:3'], answer: 1 },
      { question: '다음 중 가장 작은 개 품종은 무엇인가요?', options: ['치와와', '푸들', '요크셔 테리어', '미니어처 슈나우저'], answer: 0 },
      { question: '개가 가장 자주 짖는 이유는 무엇인가요?', options: ['배고프다', '경고나 방어', '지루함', '행복함'], answer: 1 },
    ];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                navigation.navigate('Login');
            } else {
                setUser(currentUser);
                fetchRankings();
                checkCooldown();
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchRankings = async () => {
        try {
            const rankingRef = collection(db, 'rankings');
            const q = query(rankingRef, orderBy('score', 'desc'), limit(3));
            const snapshot = await getDocs(q);
            const rankingList = snapshot.docs.map(doc => doc.data());
            setRankings(rankingList);
        } catch (error) {
            console.error('Error fetching rankings:', error);
        }
    };

    const checkCooldown = async () => {
        const lastCompleted = await AsyncStorage.getItem('lastQuizTime');
        if (lastCompleted) {
            const elapsedTime = Date.now() - parseInt(lastCompleted, 10);
            if (elapsedTime < QUIZ_COOLDOWN) {
                setCooldown(true);
                setTimeout(() => {
                    resetQuiz();
                }, QUIZ_COOLDOWN - elapsedTime);
            }
        }
    };

    const handleStartQuiz = () => {
        setShowTitle(false);
        setQuestionIndex(0);
        setScore(0);
        setQuizCompleted(false);
    };

    const handleAnswer = (index) => {
        if (index === quizData[questionIndex].answer) {
            setScore(score + 1);
        }
        if (questionIndex + 1 < quizData.length) {
            setQuestionIndex(questionIndex + 1);
        } else {
            setQuizCompleted(true);
            setTimeout(() => {
                setShowTitle(true); // 퀴즈 끝나면 타이틀 화면으로 이동
            }, 2000);
        }
    };
    

    const handleSubmitScore = async () => {
      if (!user) {
          Alert.alert('오류', '로그인이 필요합니다.');
          return;
      }
  
      const newRanking = { name: user.email, score };
  
      try {
          await addDoc(collection(db, 'rankings'), newRanking);
          Alert.alert('점수가 저장되었습니다!');
          await fetchRankings();  // 🔥 최신 랭킹을 불러와 UI 업데이트
      } catch (error) {
          console.error('Error adding document: ', error);
          Alert.alert('점수 저장에 실패했습니다.');
      }
  
      await AsyncStorage.setItem('lastQuizTime', Date.now().toString());
      setCooldown(true);
  
      setTimeout(() => {
          resetQuiz();
      }, QUIZ_COOLDOWN);
  };
  
  

  const resetQuiz = async () => {
    setShowTitle(true);
    setCooldown(false);

    try {
        const rankingRef = collection(db, 'rankings');
        const snapshot = await getDocs(rankingRef);

        // Firestore에서 모든 랭킹 삭제 (비동기 동작 보장)
        const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletePromises);  // 🔥 모든 삭제가 완료될 때까지 기다림

        setRankings([]);  // UI에서도 즉시 초기화
        Alert.alert('랭킹이 초기화되었습니다. 새로운 퀴즈를 시작할 수 있습니다!');

        fetchRankings();  // 🔥 최신 데이터 반영 (Firestore에서 다시 불러오기)
    } catch (error) {
        console.error('Error resetting rankings: ', error);
    }
};



    const renderTitleScreen = () => (
        <View style={styles.container}>
            <Text style={styles.titleText}>퀴즈 게임</Text>
            <Text style={styles.subText}>상위 3위 랭킹</Text>
            <FlatList
                data={rankings}
                renderItem={({ item, index }) => (
                    <Text style={styles.rankText}>{`${index + 1}. ${item.name} - ${item.score}점`}</Text>
                )}
                keyExtractor={(item, index) => index.toString()}
            />
            <Button title="퀴즈 시작" onPress={handleStartQuiz} disabled={cooldown} />
            {cooldown && <Text style={styles.cooldownText}>5분 후 다시 도전할 수 있습니다.</Text>}
        </View>
    );

    const renderQuiz = () => (
        <View style={styles.quizContainer}>
            <Text style={styles.question}>{quizData[questionIndex].question}</Text>
            {quizData[questionIndex].options.map((option, index) => (
                <Button key={index} title={option} onPress={() => handleAnswer(index)} />
            ))}
        </View>
    );

    const renderResult = () => (
        <View style={styles.resultContainer}>
            <Text style={styles.resultText}>퀴즈 완료!</Text>
            <Text style={styles.resultText}>당신의 점수: {score} / 5</Text>
            <Button title="점수 저장" onPress={handleSubmitScore} />
        </View>
    );

    return <View style={styles.container}>{showTitle ? renderTitleScreen() : quizCompleted ? renderResult() : renderQuiz()}</View>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    titleText: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subText: {
        fontSize: 20,
        marginBottom: 5,
    },
    quizContainer: {
        width: '100%',
        alignItems: 'center',
    },
    question: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    resultContainer: {
        alignItems: 'center',
    },
    resultText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    rankText: {
        fontSize: 18,
        marginVertical: 5,
    },
    cooldownText: {
        fontSize: 16,
        color: 'red',
        marginTop: 10,
    },
});

export default QuizScreen;
