pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    IMAGE_NAME     = "express-app"
    CONTAINER_NAME = "express-ci-${env.BUILD_NUMBER}"
    APP_PORT       = "3000"
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build') {
      steps {
        powershell '''
          Write-Host "Building Docker image"
          docker build -f DOCKERFILE -t $env:IMAGE_NAME .
        '''
      }
    }

    stage('Run (Docker)') {
      steps {
        powershell '''
          Write-Host "Starting container"

          docker rm -f $env:CONTAINER_NAME 2>$null

          docker run -d `
            --name $env:CONTAINER_NAME `
            -e REQUIRE_DB=false `
            -p $env:APP_PORT:$env:APP_PORT `
            $env:IMAGE_NAME
        '''
      }
    }

    stage('Smoke Test') {
      steps {
        powershell '''
          Start-Sleep -Seconds 5
          .\\scripts\\smoke.ps1 $env:APP_PORT
        '''
      }
    }

    stage('Release Build') {
      when {
        tag pattern: "v\\d+\\.\\d+\\.\\d+", comparator: "REGEXP"
      }
      steps {
        powershell '''
          Write-Host "Release build for tag $env:GIT_TAG"
          docker tag $env:IMAGE_NAME "$env:IMAGE_NAME:$env:GIT_TAG"
        '''
      }
    }

    stage('Archive Artifacts') {
      steps {
        archiveArtifacts artifacts: '''
          Jenkinsfile,
          DOCKERFILE,
          scripts/**
        ''', fingerprint: true
      }
    }
  }

  post {
    always {
      powershell '''
        docker rm -f $env:CONTAINER_NAME 2>$null
      '''
    }
  }
}